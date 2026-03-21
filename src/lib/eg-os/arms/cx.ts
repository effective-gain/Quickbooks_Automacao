// ==========================================
// Braco 5 — CX (Experiencia do Cliente)
// WhatsApp messaging, email, notifications
// ==========================================

import type { OrchestratorAction, ActionType } from '../orchestrator'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'eg-build'

export async function handleCX(
  action: OrchestratorAction,
  agent: string
): Promise<{ data?: unknown; nextActions?: ActionType[] }> {
  switch (agent) {
    case 'WhatsAppAgent':
      return handleWhatsApp(action)
    case 'EmailAgent':
      return handleEmail(action)
    case 'SubNotifier':
      return handleSubNotification(action)
    case 'InvoiceSender':
      return handleInvoiceSend(action)
    default:
      return { data: { message: `Agent ${agent} not implemented` } }
  }
}

// ==========================================
// WhatsApp via Evolution API
// ==========================================

async function sendWhatsAppMessage(
  phone: string,
  message: string,
  mediaUrl?: string
): Promise<{ sent: boolean; messageId?: string }> {
  if (!EVOLUTION_API_URL) {
    console.warn('[CX] Evolution API not configured, message queued')
    return { sent: false }
  }

  const endpoint = mediaUrl
    ? `${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`
    : `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`

  const body = mediaUrl
    ? { number: phone, mediatype: 'document', media: mediaUrl, caption: message }
    : { number: phone, text: message }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp send failed: ${err}`)
  }

  const data = await res.json()
  return { sent: true, messageId: data.key?.id }
}

async function handleWhatsApp(action: OrchestratorAction) {
  const { phone, message, mediaUrl, template } = action.payload as {
    phone: string
    message?: string
    mediaUrl?: string
    template?: string
  }

  const text = message || getTemplate(template || 'generic', action.payload)
  const result = await sendWhatsAppMessage(phone, text, mediaUrl)

  return { data: result }
}

async function handleSubNotification(action: OrchestratorAction) {
  const { subcontractorId, notificationType, data: notifData } = action.payload as {
    subcontractorId: string
    notificationType: 'document_request' | 'budget_request' | 'payment_update' | 'general'
    data?: Record<string, unknown>
  }

  // Load subcontractor contact info
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('subcontractors')
    .select('*')
    .eq('id', subcontractorId)
    .single()

  if (!sub) throw new Error('Subcontractor not found')

  const results: { whatsapp?: boolean; email?: boolean } = {}

  // Send WhatsApp if phone available
  if (sub.phone) {
    const message = getTemplate(notificationType, { ...notifData, subName: sub.name })
    const wa = await sendWhatsAppMessage(sub.phone, message)
    results.whatsapp = wa.sent
  }

  return { data: { subcontractor: sub.name, ...results } }
}

async function handleInvoiceSend(action: OrchestratorAction) {
  const { invoiceId } = action.payload as { invoiceId: string }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, subcontractors(*)')
    .eq('id', invoiceId)
    .single()

  if (!invoice) throw new Error('Invoice not found')

  // Update status to sent
  await supabase
    .from('invoices')
    .update({ status: 'sent' })
    .eq('id', invoiceId)

  // Send notification to subcontractor
  const sub = invoice.subcontractors
  if (sub?.phone) {
    const message = getTemplate('invoice_sent', {
      subName: sub.name,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.amount,
      dueDate: invoice.due_date,
    })
    await sendWhatsAppMessage(sub.phone, message)
  }

  return {
    data: { invoiceId, status: 'sent' },
    nextActions: ['sync_quickbooks'] as ActionType[],
  }
}

async function handleEmail(action: OrchestratorAction) {
  const { to, subject, body } = action.payload as {
    to: string; subject: string; body: string
  }

  // In production, this integrates with SendGrid/Resend/n8n email
  // For now, trigger via n8n webhook
  return {
    data: { queued: true, to, subject },
    nextActions: ['trigger_n8n_workflow'] as ActionType[],
  }
}

// ==========================================
// Message Templates (multi-language)
// ==========================================

function getTemplate(type: string, data: Record<string, unknown> = {}): string {
  const templates: Record<string, string> = {
    document_request: `Hi ${data.subName || 'there'},\n\nWe need the following document(s) for compliance:\n${data.documentType || 'Certificate of Insurance'}\n\nPlease upload or reply with a photo/scan.\n\nThank you,\nBuildBooks - EG Build`,

    budget_request: `Hi ${data.subName || 'there'},\n\nWe have a new budget request for your review.\nProject: ${data.projectName || 'New Project'}\n\nPlease review and send your quote.\n\nBuildBooks - EG Build`,

    payment_update: `Hi ${data.subName || 'there'},\n\nPayment update:\nInvoice: ${data.invoiceNumber || ''}\nAmount: $${data.amount || '0'}\nStatus: ${data.status || 'Processed'}\n\nBuildBooks - EG Build`,

    invoice_sent: `Hi ${data.subName || 'there'},\n\nInvoice ${data.invoiceNumber || ''} for $${Number(data.amount || 0).toLocaleString()} has been sent.\nDue date: ${data.dueDate || ''}\n\nBuildBooks - EG Build`,

    document_reminder: `Hi ${data.subName || 'there'},\n\nFriendly reminder: we still need your ${data.documentType || 'documents'} for compliance.\n\nPlease upload or reply with a photo.\n\nBuildBooks - EG Build`,

    generic: `Hi ${data.subName || 'there'},\n\n${data.message || 'You have a new notification from BuildBooks.'}\n\nBuildBooks - EG Build`,
  }

  return templates[type] || templates.generic
}
