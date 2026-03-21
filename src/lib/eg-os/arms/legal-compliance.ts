// ==========================================
// Braco 3 — Juridico & Compliance
// Document management, compliance checking
// ==========================================

import type { OrchestratorAction, ActionType } from '../orchestrator'
import { createClient } from '@/lib/supabase/server'

export async function handleLegalCompliance(
  action: OrchestratorAction,
  agent: string
): Promise<{ data?: unknown; nextActions?: ActionType[] }> {
  switch (agent) {
    case 'DocumentRequester':
      return handleDocumentRequest(action)
    case 'ComplianceChecker':
      return handleComplianceCheck(action)
    case 'ReminderAgent':
      return handleReminder(action)
    default:
      return { data: { message: `Agent ${agent} not implemented` } }
  }
}

async function handleDocumentRequest(action: OrchestratorAction) {
  const { subcontractorId, documentTypes } = action.payload as {
    subcontractorId: string
    documentTypes: string[]
  }

  const supabase = await createClient()

  const requests = []
  for (const docType of documentTypes) {
    const { data } = await supabase.from('document_requests').insert({
      subcontractor_id: subcontractorId,
      document_type: docType,
      status: 'pending',
    }).select().single()
    if (data) requests.push(data)
  }

  return {
    data: { requests, count: requests.length },
    nextActions: ['notify_subcontractor'] as ActionType[],
  }
}

async function handleComplianceCheck(action: OrchestratorAction) {
  const { subcontractorId } = action.payload as { subcontractorId: string }

  const supabase = await createClient()

  const { data: docs } = await supabase
    .from('document_requests')
    .select('*')
    .eq('subcontractor_id', subcontractorId)

  if (!docs) return { data: { compliant: false, reason: 'No documents found' } }

  const requiredTypes = ['Certificate of Insurance', 'W-9 Form']
  const approved = docs.filter(d => d.status === 'approved')
  const approvedTypes = approved.map(d => d.document_type)

  const missing = requiredTypes.filter(t => !approvedTypes.includes(t))
  const expired = docs.filter(d => d.status === 'expired')

  const isCompliant = missing.length === 0 && expired.length === 0

  // Update subcontractor compliance status
  await supabase
    .from('subcontractors')
    .update({ is_compliant: isCompliant })
    .eq('id', subcontractorId)

  return {
    data: {
      compliant: isCompliant,
      total: docs.length,
      approved: approved.length,
      missing,
      expired: expired.length,
    },
    nextActions: isCompliant ? [] : ['send_document_reminder'] as ActionType[],
  }
}

async function handleReminder(action: OrchestratorAction) {
  const { subcontractorId, documentType } = action.payload as {
    subcontractorId: string
    documentType?: string
  }

  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('subcontractors')
    .select('*')
    .eq('id', subcontractorId)
    .single()

  if (!sub) throw new Error('Subcontractor not found')

  // Get pending/expired documents
  const query = supabase
    .from('document_requests')
    .select('*')
    .eq('subcontractor_id', subcontractorId)
    .in('status', ['pending', 'expired'])

  if (documentType) query.eq('document_type', documentType)

  const { data: pendingDocs } = await query

  return {
    data: {
      subcontractor: sub.name,
      phone: sub.phone,
      pendingDocuments: pendingDocs?.map(d => d.document_type) || [],
    },
    nextActions: sub.phone ? ['send_whatsapp'] as ActionType[] : ['send_email'] as ActionType[],
  }
}
