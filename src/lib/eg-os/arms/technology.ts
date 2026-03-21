// ==========================================
// Braco 7 — Tecnologia & Processos
// WhatsApp (Evolution API) + Whisper + n8n
// ==========================================

import type { OrchestratorAction, ActionType } from '../orchestrator'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'eg-build'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || ''

export async function handleTechnology(
  action: OrchestratorAction,
  agent: string
): Promise<{ data?: unknown; nextActions?: ActionType[] }> {
  switch (agent) {
    case 'WhisperTranscriber':
      return handleWhisperTranscription(action)
    case 'N8NTrigger':
      return handleN8NTrigger(action)
    case 'AutomationRunner':
      return handleAutomation(action)
    default:
      return { data: { message: `Agent ${agent} not implemented` } }
  }
}

// ==========================================
// Whisper Transcription
// Audio WhatsApp → Whisper → Structured Data
// ==========================================

async function handleWhisperTranscription(action: OrchestratorAction) {
  const { audioUrl, audioBase64, mimeType, fromPhone, context } = action.payload as {
    audioUrl?: string
    audioBase64?: string
    mimeType?: string
    fromPhone: string
    context?: string
  }

  if (!audioUrl && !audioBase64) {
    throw new Error('No audio provided (need audioUrl or audioBase64)')
  }

  // Step 1: Get audio data
  let audioBuffer: Buffer

  if (audioUrl) {
    // Download from Evolution API media URL
    const res = await fetch(audioUrl, {
      headers: EVOLUTION_API_KEY ? { apikey: EVOLUTION_API_KEY } : {},
    })
    if (!res.ok) throw new Error(`Failed to download audio: ${res.status}`)
    audioBuffer = Buffer.from(await res.arrayBuffer())
  } else {
    audioBuffer = Buffer.from(audioBase64!, 'base64')
  }

  // Step 2: Send to Whisper API
  const formData = new FormData()
  formData.append('file', new Blob([new Uint8Array(audioBuffer)], { type: mimeType || 'audio/ogg' }), 'audio.ogg')
  formData.append('model', 'whisper-1')
  formData.append('language', 'en')
  formData.append('response_format', 'json')

  const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  })

  if (!whisperRes.ok) {
    const err = await whisperRes.text()
    throw new Error(`Whisper API error: ${err}`)
  }

  const { text: transcript } = await whisperRes.json() as { text: string }

  // Step 3: Parse transcript into structured data using Claude/GPT
  const structuredData = await parseTranscriptToSchema(transcript, context)

  return {
    data: {
      transcript,
      structured: structuredData,
      fromPhone,
      processedAt: new Date().toISOString(),
    },
    nextActions: determineNextActions(structuredData),
  }
}

// Parse natural language transcript into Pydantic-compatible schema
async function parseTranscriptToSchema(
  transcript: string,
  context?: string
): Promise<TranscriptSchema> {
  // Use Claude API to extract structured data
  const prompt = `Extract structured data from this construction-related voice message.

Transcript: "${transcript}"
${context ? `Context: ${context}` : ''}

Return JSON with these fields (only include what's mentioned):
{
  "intent": "expense_report | progress_update | material_request | document_submission | invoice_request | general",
  "project_name": "string or null",
  "category": "foundation | framing | electrical | plumbing | hvac | finishes | roofing | site_work | materials | labor | equipment | other",
  "amount": number or null,
  "vendor": "string or null",
  "description": "string",
  "urgency": "low | normal | high",
  "documents_mentioned": ["string"],
  "action_items": ["string"]
}`

  // For now, return a basic parse. In production, this calls Claude/GPT.
  const schema: TranscriptSchema = {
    intent: 'general',
    description: transcript,
    urgency: 'normal',
    documents_mentioned: [],
    action_items: [],
  }

  // Simple keyword detection
  if (/invoice|fatura|bill/i.test(transcript)) schema.intent = 'invoice_request'
  else if (/spent|paid|cost|expense|\$\d/i.test(transcript)) schema.intent = 'expense_report'
  else if (/progress|update|complete|done|finish/i.test(transcript)) schema.intent = 'progress_update'
  else if (/need|order|material|supply/i.test(transcript)) schema.intent = 'material_request'
  else if (/insurance|w-?9|lien|document|license/i.test(transcript)) schema.intent = 'document_submission'

  // Extract dollar amounts
  const amountMatch = transcript.match(/\$?([\d,]+(?:\.\d{2})?)/i)
  if (amountMatch) schema.amount = parseFloat(amountMatch[1].replace(',', ''))

  return schema
}

interface TranscriptSchema {
  intent: string
  project_name?: string | null
  category?: string
  amount?: number | null
  vendor?: string | null
  description: string
  urgency: string
  documents_mentioned: string[]
  action_items: string[]
}

function determineNextActions(schema: TranscriptSchema): ActionType[] {
  switch (schema.intent) {
    case 'expense_report':
      return ['categorize_transaction', 'create_cost_entry']
    case 'invoice_request':
      return ['create_invoice']
    case 'material_request':
      return ['dispatch_budget']
    case 'document_submission':
      return ['check_compliance']
    case 'progress_update':
      return ['track_kpi']
    default:
      return []
  }
}

// ==========================================
// n8n Workflow Trigger
// ==========================================

async function handleN8NTrigger(action: OrchestratorAction) {
  const { workflowId, data } = action.payload as {
    workflowId?: string
    data: Record<string, unknown>
  }

  const url = workflowId
    ? `${N8N_WEBHOOK_URL}/${workflowId}`
    : N8N_WEBHOOK_URL

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.N8N_WEBHOOK_SECRET || ''}`,
    },
    body: JSON.stringify({
      source: 'eg-build',
      timestamp: action.timestamp,
      ...data,
    }),
  })

  if (!res.ok) {
    throw new Error(`n8n webhook failed: ${res.status}`)
  }

  const result = await res.json().catch(() => ({}))
  return { data: result }
}

// ==========================================
// Automation Runner
// ==========================================

async function handleAutomation(action: OrchestratorAction) {
  const { automationId } = action.payload as { automationId: string }

  // Load automation from database and execute
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: rule } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('id', automationId)
    .single()

  if (!rule) throw new Error(`Automation ${automationId} not found`)
  if (!rule.is_active) throw new Error(`Automation ${automationId} is inactive`)

  // Log execution
  await supabase.from('sync_logs').insert({
    company_id: rule.company_id,
    entity_type: `automation:${rule.name}`,
    status: 'running',
    started_at: new Date().toISOString(),
  })

  return { data: { automation: rule.name, triggered: true } }
}
