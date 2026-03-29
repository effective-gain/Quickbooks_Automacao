// ==========================================
// EG BUILD — Main Agent Pipeline
// 3 Layers: ENTRADA → EXECUÇÃO → INTELIGÊNCIA
//
// Layer 1 (ENTRADA): Receptor → Linguista → Classificador
// Layer 2 (EXECUÇÃO): Contador / Faturista / Contas a Pagar
// Layer 3 (INTELIGÊNCIA): Fiscal / Compliance / Comunicador + QA
//
// Every message flows through this pipeline.
// ==========================================

import { processIncoming } from './01-receptor'
import { processLanguage } from './02-linguista'
import { classifyMessage } from './03-classificador'
import { validateTransaction } from './08-fiscal'
import { readInvoiceFromImage, registerBill, check1099Status } from './06-contas-a-pagar'
import { qaWithRetry } from './qa-agent'
import { deliverResponse } from './10-comunicador'
import type { ReceivedMessage, AgentResponse, ClassifierOutput, LinguistOutput } from './types'
import { createClient } from '@/lib/supabase/server'
import { getActiveConnection } from '@/lib/quickbooks/sync'
import { createPurchase, createInvoice, sendInvoiceEmail, queryQB } from '@/lib/quickbooks/client'

export interface PipelineResult {
  success: boolean
  intent: string
  agentResponse: AgentResponse
  qaScore: number
  escalated: boolean
}

export async function runPipeline(
  webhookData: Record<string, unknown>,
  companyId: string
): Promise<PipelineResult> {
  // ==========================================
  // LAYER 1 — ENTRADA
  // ==========================================

  // Agent 1: Receptor
  const message = await processIncoming(webhookData)

  // Agent 2: Linguista
  const linguist = await processLanguage(message)

  // If image, get description for classifier
  let imageDescription: string | undefined
  if (message.type === 'image' && message.imageUrl) {
    try {
      const visionResult = await readInvoiceFromImage(message.imageUrl)
      imageDescription = `Invoice from ${visionResult.vendor || 'unknown'}, amount $${visionResult.amount || 0}`
    } catch {
      imageDescription = message.caption || 'Image received'
    }
  }

  // Agent 3: Classificador
  const classified = await classifyMessage(linguist, imageDescription)
  console.log(`[Pipeline] Intent: ${classified.intent} (${(classified.confidence * 100).toFixed(0)}%) | ${classified.extractedData.description}`)

  // ==========================================
  // LAYER 2 — EXECUÇÃO + LAYER 3 — INTELIGÊNCIA
  // ==========================================

  const { response, qa } = await qaWithRetry(
    (retryContext) => executeIntent(classified, linguist, message, companyId, retryContext),
    classified
  )

  // ==========================================
  // DELIVER — Agent 10: Comunicador
  // ==========================================

  await deliverResponse(
    response,
    qa,
    message.from,
    classified.intent,
    linguist.detectedLanguage,
    companyId,
    {
      amount: classified.extractedData.amount ?? undefined,
      vendor: classified.extractedData.vendor ?? undefined,
      project: classified.extractedData.project ?? undefined,
    }
  )

  return {
    success: response.success,
    intent: classified.intent,
    agentResponse: response,
    qaScore: qa.score,
    escalated: qa.escalated,
  }
}

// ==========================================
// Intent Router — dispatches to correct agent
// ==========================================

async function executeIntent(
  classified: ClassifierOutput,
  linguist: LinguistOutput,
  message: ReceivedMessage,
  companyId: string,
  retryContext?: string
): Promise<AgentResponse> {
  switch (classified.intent) {
    case 'DESPESA':
      return handleExpense(classified, companyId, retryContext)

    case 'INVOICE':
      return handleInvoice(classified, companyId, retryContext)

    case 'BILL':
    case 'FOTO':
      return handleBill(classified, message, companyId, retryContext)

    case 'CONSULTA':
      return handleQuery(classified, companyId, retryContext)

    case 'CHANGE_ORDER':
      return handleChangeOrder(classified, companyId)

    case 'COTACAO':
      return handleQuote(classified, companyId)

    case 'APROVACAO':
      return handleApproval(classified, companyId)

    default:
      return {
        agentName: 'General',
        success: true,
        data: null,
        message: `Hi! I'm BuildBooks, your construction financial assistant. I can help you with:\n\n• Log expenses\n• Create invoices\n• Process bills from subs\n• Check balances and reports\n• Track project costs\n\nJust send a message or voice note describing what you need!`,
        language: linguist.detectedLanguage,
      }
  }
}

// ==========================================
// DESPESA — Agent 4 (Contador) + Agent 8 (Fiscal)
// ==========================================

async function handleExpense(
  classified: ClassifierOutput,
  companyId: string,
  retryContext?: string
): Promise<AgentResponse> {
  const { amount, vendor, category, project, description } = classified.extractedData

  // Agent 8: Fiscal validation
  const fiscal = await validateTransaction(classified, companyId)

  if (!amount) {
    return {
      agentName: 'Contador',
      success: false,
      data: null,
      message: `I understood you want to log an expense${vendor ? ` to ${vendor}` : ''}. How much was it?${retryContext ? `\n\n(${retryContext})` : ''}`,
      language: 'en',
    }
  }

  // Agent 4: Create in QuickBooks
  const conn = await getActiveConnection(companyId)
  let qbTxnId: string | undefined

  if (conn) {
    try {
      const result = await createPurchase(
        {
          AccountRef: { value: '1' },
          PaymentType: 'Cash',
          Line: [{
            Amount: amount + fiscal.salesTaxAmount,
            DetailType: 'AccountBasedExpenseLineDetail' as const,
            AccountBasedExpenseLineDetail: {
              AccountRef: { value: '1' },
            },
            Description: description,
          }],
          TxnDate: classified.extractedData.date || new Date().toISOString().split('T')[0],
        },
        { realmId: conn.realmId, accessToken: conn.accessToken }
      ) as { Purchase: { Id: string } }
      qbTxnId = result.Purchase.Id
    } catch (error) {
      console.error('[Contador] QB error:', error)
    }
  }

  // Save to local DB
  const supabase = await createClient()
  await supabase.from('cost_entries').insert({
    project_id: project ? undefined : undefined, // TODO: resolve project ID
    category_id: undefined, // TODO: resolve category ID
    description,
    amount,
    date: classified.extractedData.date || new Date().toISOString().split('T')[0],
    qb_txn_id: qbTxnId,
  })

  // Build response
  let msg = `*Expense Recorded* ${qbTxnId ? '✅' : '⚠️'}\n\n`
  msg += `Amount: *$${amount.toLocaleString()}*\n`
  if (vendor) msg += `Vendor: ${vendor}\n`
  if (category) msg += `Category: ${category}\n`
  if (project) msg += `Project: ${project}\n`

  if (fiscal.salesTaxApplied) {
    msg += `\nMA Sales Tax (6.25%): $${fiscal.salesTaxAmount}\n`
    msg += `Total with tax: $${(amount + fiscal.salesTaxAmount).toLocaleString()}\n`
  }

  if (fiscal.warnings.length > 0) {
    msg += `\n${fiscal.warnings.join('\n')}\n`
  }

  if (!qbTxnId) msg += `\n⚠️ QuickBooks not connected. Saved locally only.`
  msg += `\n\nWant to add more details or log another expense?`

  return {
    agentName: 'Contador',
    success: true,
    data: { qbTxnId, amount, fiscal },
    message: msg,
    language: 'en',
  }
}

// ==========================================
// INVOICE — Agent 5 (Faturista)
// ==========================================

async function handleInvoice(
  classified: ClassifierOutput,
  companyId: string,
  retryContext?: string
): Promise<AgentResponse> {
  const { amount, customer, items, description } = classified.extractedData

  if (!amount && !items?.length) {
    return {
      agentName: 'Faturista',
      success: false,
      data: null,
      message: `I'll create an invoice${customer ? ` for ${customer}` : ''}. What's the amount and description?${retryContext ? `\n\n(${retryContext})` : ''}`,
      language: 'en',
    }
  }

  const conn = await getActiveConnection(companyId)
  let qbInvoiceId: string | undefined

  if (conn) {
    try {
      const invoicePayload = {
        CustomerRef: { value: '1' }, // TODO: resolve customer ID
        Line: (items || [{ description, quantity: 1, unitPrice: amount || 0 }]).map(item => ({
          Amount: item.quantity * item.unitPrice,
          DetailType: 'SalesItemLineDetail' as const,
          SalesItemLineDetail: {
            ItemRef: { value: '1', name: 'Services' },
            Qty: item.quantity,
            UnitPrice: item.unitPrice,
          },
          Description: item.description,
        })),
      }

      const result = await createInvoice(invoicePayload, {
        realmId: conn.realmId,
        accessToken: conn.accessToken,
      }) as { Invoice: { Id: string; DocNumber: string } }
      qbInvoiceId = result.Invoice.Id
    } catch (error) {
      console.error('[Faturista] QB error:', error)
    }
  }

  const total = items?.reduce((s, i) => s + i.quantity * i.unitPrice, 0) || amount || 0

  let msg = `*Invoice Created* ${qbInvoiceId ? '✅' : '⚠️'}\n\n`
  msg += `Amount: *$${total.toLocaleString()}*\n`
  if (customer) msg += `Customer: ${customer}\n`
  if (qbInvoiceId) msg += `QB Invoice ID: ${qbInvoiceId}\n`

  msg += `\nWould you like me to:\n• Send it by email?\n• Add more line items?\n• Create another invoice?`

  return {
    agentName: 'Faturista',
    success: true,
    data: { qbInvoiceId, total },
    message: msg,
    language: 'en',
  }
}

// ==========================================
// BILL / FOTO — Agent 6 (Contas a Pagar)
// ==========================================

async function handleBill(
  classified: ClassifierOutput,
  message: ReceivedMessage,
  companyId: string,
  retryContext?: string
): Promise<AgentResponse> {
  let extracted = classified.extractedData

  // If it's a photo, use Vision to extract data
  if (message.type === 'image' && message.imageUrl) {
    try {
      const visionData = await readInvoiceFromImage(message.imageUrl)
      extracted = { ...extracted, ...visionData }
    } catch (error) {
      return {
        agentName: 'Contas a Pagar',
        success: false,
        data: null,
        message: `I received the photo but couldn't read it clearly. Can you:\n• Send a clearer photo?\n• Or type the details: vendor name, amount, and invoice number?`,
        language: 'en',
      }
    }
  }

  // Agent 8: Fiscal validation
  const fiscal = await validateTransaction({ ...classified, extractedData: extracted }, companyId)

  // Agent 9: 1099 check
  const compliance = extracted.vendor
    ? await check1099Status(companyId, extracted.vendor)
    : null

  // Register the bill
  const { billId, qbBillId } = await registerBill(extracted, companyId)

  let msg = `*Bill Registered* ${qbBillId ? '✅' : '⚠️'}\n\n`
  msg += `Vendor: *${extracted.vendor || 'Unknown'}*\n`
  msg += `Amount: *$${(extracted.amount || 0).toLocaleString()}*\n`
  if (extracted.invoiceNumber) msg += `Invoice #: ${extracted.invoiceNumber}\n`

  if (fiscal.warnings.length > 0) {
    msg += `\n${fiscal.warnings.join('\n')}\n`
  }

  if (compliance?.warning) {
    msg += `\n${compliance.warning}\n`
  } else if (compliance && !compliance.hasW9 && compliance.totalPaid > 0) {
    msg += `\n📋 Reminder: No W-9 on file for ${extracted.vendor}. Request it before year-end.\n`
  }

  msg += `\nWant to approve this bill for payment?`

  return {
    agentName: 'Contas a Pagar',
    success: true,
    data: { billId, qbBillId, fiscal, compliance },
    message: msg,
    language: 'en',
  }
}

// ==========================================
// CONSULTA — Query handler
// ==========================================

async function handleQuery(
  classified: ClassifierOutput,
  companyId: string,
  retryContext?: string
): Promise<AgentResponse> {
  const conn = await getActiveConnection(companyId)
  const supabase = await createClient()

  // Get project summary
  const { data: projects } = await supabase
    .from('projects')
    .select('name, budget_total, actual_total, total_sf, status')
    .eq('company_id', companyId)

  let msg = `*Your Projects Summary*\n\n`

  if (projects?.length) {
    for (const p of projects) {
      const costPerSF = p.total_sf && Number(p.total_sf) > 0
        ? (Number(p.actual_total) / Number(p.total_sf)).toFixed(2)
        : '—'
      const utilization = Number(p.budget_total) > 0
        ? ((Number(p.actual_total) / Number(p.budget_total)) * 100).toFixed(0)
        : '0'

      msg += `📁 *${p.name}* (${p.status})\n`
      msg += `   Budget: $${Number(p.budget_total).toLocaleString()}\n`
      msg += `   Spent: $${Number(p.actual_total).toLocaleString()} (${utilization}%)\n`
      msg += `   $/SF: $${costPerSF}\n\n`
    }
  } else {
    msg += `No projects found. Would you like to create one?`
  }

  msg += `\nAsk me anything specific — expenses by vendor, project costs, or pending invoices.`

  return {
    agentName: 'Consulta',
    success: true,
    data: { projects },
    message: msg,
    language: 'en',
  }
}

// ==========================================
// Stubs for remaining intents
// ==========================================

async function handleChangeOrder(classified: ClassifierOutput, companyId: string): Promise<AgentResponse> {
  return {
    agentName: 'Obras',
    success: true,
    data: null,
    message: `*Change Order Noted* 📝\n\n${classified.extractedData.description}\n\nThis will be reviewed and added to the project scope. I'll update the budget accordingly.\n\nConfirm this change order?`,
    language: 'en',
  }
}

async function handleQuote(classified: ClassifierOutput, companyId: string): Promise<AgentResponse> {
  return {
    agentName: 'Faturista',
    success: true,
    data: null,
    message: `*Quote Request* 📋\n\nI'll prepare an estimate${classified.extractedData.customer ? ` for ${classified.extractedData.customer}` : ''}.\n\nPlease provide:\n• Scope of work\n• Materials needed\n• Timeline\n\nOr send me your takeoff/plans and I'll generate quantities.`,
    language: 'en',
  }
}

async function handleApproval(classified: ClassifierOutput, companyId: string): Promise<AgentResponse> {
  return {
    agentName: 'General',
    success: true,
    data: null,
    message: `Got it! What would you like me to approve or reject? Send me the details or reference number.`,
    language: 'en',
  }
}
