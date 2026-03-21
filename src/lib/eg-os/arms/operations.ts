// ==========================================
// Braco 8 — Operacoes & Supply Chain
// Squad Automacao Construcao EUA
// ==========================================

import type { OrchestratorAction, ActionType } from '../orchestrator'
import { createClient } from '@/lib/supabase/server'
import { syncAll, getActiveConnection } from '@/lib/quickbooks/sync'
import { createInvoice, createPurchase } from '@/lib/quickbooks/client'

export async function handleOperations(
  action: OrchestratorAction,
  agent: string
): Promise<{ data?: unknown; nextActions?: ActionType[] }> {
  switch (agent) {
    case 'CostController':
      return handleCostEntry(action)
    case 'AutoCategorizer':
      return handleCategorization(action)
    case 'TakeoffProcessor':
      return handleTakeoff(action)
    case 'BudgetDispatcher':
      return handleBudgetDispatch(action)
    case 'QBSyncAgent':
      return handleQBSync(action)
    case 'BankReconciler':
      return handleReconciliation(action)
    case 'InvoiceCreator':
      return handleInvoiceCreation(action)
    case 'PaymentRecorder':
      return handlePaymentRecord(action)
    default:
      return { data: { message: `Agent ${agent} not implemented` } }
  }
}

async function handleCostEntry(action: OrchestratorAction) {
  const supabase = await createClient()
  const { projectId, categoryId, description, amount, date, vendorId } = action.payload as {
    projectId: string; categoryId: string; description: string; amount: number; date: string; vendorId?: string
  }

  const { data, error } = await supabase.from('cost_entries').insert({
    project_id: projectId,
    category_id: categoryId,
    description,
    amount,
    date,
    vendor_id: vendorId,
  }).select().single()

  if (error) throw new Error(error.message)

  // Update project actual_total
  await supabase.rpc('update_project_actual', { p_project_id: projectId })

  return {
    data,
    nextActions: ['sync_quickbooks', 'track_kpi'] as ActionType[],
  }
}

async function handleCategorization(action: OrchestratorAction) {
  const supabase = await createClient()
  const { transactionId, description, amount } = action.payload as {
    transactionId: string; description: string; amount: number
  }

  // Load company automation rules
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('is_active', true)
    .eq('trigger_type', 'categorize_transaction')

  if (!rules?.length) {
    return { data: { matched: false, message: 'No categorization rules found' } }
  }

  // Simple rule matching
  for (const rule of rules) {
    const conditions = rule.conditions as { field?: string; operator?: string; value?: string }
    const actions = rule.actions as { categoryId?: string; costCenter?: string }

    let matched = false
    if (conditions.field === 'description' && conditions.operator === 'contains') {
      matched = description.toLowerCase().includes((conditions.value || '').toLowerCase())
    } else if (conditions.field === 'amount' && conditions.operator === 'greater_than') {
      matched = amount > Number(conditions.value)
    }

    if (matched && actions.categoryId) {
      // Update the transaction with the matched category
      await supabase
        .from('bank_transactions')
        .update({ category_id: actions.categoryId })
        .eq('id', transactionId)

      return {
        data: { matched: true, rule: rule.name, categoryId: actions.categoryId },
        nextActions: ['create_cost_entry'] as ActionType[],
      }
    }
  }

  return { data: { matched: false, message: 'No rule matched' } }
}

async function handleTakeoff(action: OrchestratorAction) {
  const { takeoffId } = action.payload as { takeoffId: string }
  const supabase = await createClient()

  await supabase
    .from('takeoffs')
    .update({ status: 'processing' })
    .eq('id', takeoffId)

  // In production, this would call an AI service to analyze the plan
  // For now, mark as ready after "processing"
  await supabase
    .from('takeoffs')
    .update({ status: 'ready' })
    .eq('id', takeoffId)

  return {
    data: { takeoffId, status: 'ready' },
    nextActions: ['dispatch_budget'] as ActionType[],
  }
}

async function handleBudgetDispatch(action: OrchestratorAction) {
  const { budgetId, subcontractorIds } = action.payload as {
    budgetId: string; subcontractorIds: string[]
  }

  // This triggers WhatsApp notifications to subs via the CX arm
  return {
    data: { budgetId, dispatchedTo: subcontractorIds.length },
    nextActions: ['send_whatsapp'] as ActionType[],
  }
}

async function handleQBSync(action: OrchestratorAction) {
  const { companyId } = action
  if (!companyId) throw new Error('No company context')

  const results = await syncAll(companyId)
  return { data: { results } }
}

async function handleReconciliation(action: OrchestratorAction) {
  const { transactionId } = action.payload as { transactionId: string }
  const supabase = await createClient()

  await supabase
    .from('bank_transactions')
    .update({ is_reconciled: true })
    .eq('id', transactionId)

  return {
    data: { transactionId, reconciled: true },
    nextActions: ['sync_quickbooks'] as ActionType[],
  }
}

async function handleInvoiceCreation(action: OrchestratorAction) {
  const supabase = await createClient()
  const { projectId, subcontractorId, items, dueDate } = action.payload as {
    projectId: string; subcontractorId?: string; items: { description: string; quantity: number; unitPrice: number }[]; dueDate: string
  }

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  // Get next invoice number
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })

  const invoiceNumber = `INV-${String((count || 0) + 1).padStart(4, '0')}`

  const { data: invoice, error } = await supabase.from('invoices').insert({
    project_id: projectId,
    subcontractor_id: subcontractorId,
    invoice_number: invoiceNumber,
    amount: total,
    due_date: dueDate,
    status: 'draft',
  }).select().single()

  if (error) throw new Error(error.message)

  // Insert line items
  for (const item of items) {
    await supabase.from('invoice_items').insert({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.quantity * item.unitPrice,
    })
  }

  return {
    data: invoice,
    nextActions: ['send_invoice'] as ActionType[],
  }
}

async function handlePaymentRecord(action: OrchestratorAction) {
  const { invoiceId } = action.payload as { invoiceId: string }
  const supabase = await createClient()

  await supabase
    .from('invoices')
    .update({ status: 'paid' })
    .eq('id', invoiceId)

  return {
    data: { invoiceId, status: 'paid' },
    nextActions: ['sync_quickbooks', 'track_kpi'] as ActionType[],
  }
}
