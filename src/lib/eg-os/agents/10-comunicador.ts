// ==========================================
// AGENT 10: COMUNICADOR
// Layer 3 — INTELIGÊNCIA
// Formats and sends responses in user's language
// Sub-agents: 10.1 Formatter, 10.2 WhatsApp Sender, 10.3 Logger
// Complexity: LOW
// ==========================================

import type { AgentResponse, DetectedLanguage, QAResult, Intent } from './types'
import { createClient } from '@/lib/supabase/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'eg-build'
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

// ==========================================
// Sub-agent 10.1: Formatter
// Translates response to user's language
// ==========================================

export async function formatResponse(
  agentResponse: AgentResponse,
  targetLanguage: DetectedLanguage,
  intent: Intent
): Promise<string> {
  const msg = agentResponse.message

  // If already in target language or English, just format
  if (targetLanguage === 'en') {
    return formatForWhatsApp(msg, intent)
  }

  // Translate to user's language using Claude
  if (ANTHROPIC_API_KEY) {
    const langName = targetLanguage === 'pt' ? 'Brazilian Portuguese' : targetLanguage === 'es' ? 'Spanish' : 'the same language mix they used'

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          messages: [{
            role: 'user',
            content: `Translate this message to ${langName}. Keep it natural and conversational (for WhatsApp). Keep dollar amounts, project names, and technical terms in English. Keep emoji.\n\nMessage:\n${msg}`,
          }],
        }),
      })

      if (res.ok) {
        const data = await res.json() as { content: Array<{ text: string }> }
        return formatForWhatsApp(data.content[0]?.text || msg, intent)
      }
    } catch {
      // Fallback to English
    }
  }

  return formatForWhatsApp(msg, intent)
}

function formatForWhatsApp(text: string, intent: Intent): string {
  // Add intent-specific emoji prefix
  const prefix: Record<string, string> = {
    DESPESA: '💰',
    INVOICE: '🧾',
    BILL: '📄',
    CONSULTA: '📊',
    CHANGE_ORDER: '🔄',
    COTACAO: '📋',
    FOTO: '📸',
    APROVACAO: '✅',
    GENERAL: '🏗️',
  }

  const emoji = prefix[intent] || '🏗️'

  // Ensure message isn't too long for WhatsApp
  let formatted = `${emoji} *BuildBooks*\n\n${text}`

  if (formatted.length > 4000) {
    formatted = formatted.substring(0, 3950) + '\n\n_(message truncated)_'
  }

  return formatted
}

// ==========================================
// Sub-agent 10.2: WhatsApp Sender
// ==========================================

export async function sendToWhatsApp(
  phone: string,
  message: string
): Promise<{ sent: boolean; messageId?: string }> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.log(`[Comunicador] Would send to ${phone}: ${message.substring(0, 100)}...`)
    return { sent: false }
  }

  const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      number: phone,
      text: message,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`[Comunicador] WhatsApp send failed: ${err}`)
    return { sent: false }
  }

  const data = await res.json() as { key?: { id?: string } }
  return { sent: true, messageId: data.key?.id }
}

// ==========================================
// Sub-agent 10.3: Logger
// Records every transaction in Supabase
// ==========================================

export async function logTransaction(entry: {
  companyId: string
  agentName: string
  intent: string
  userPhone: string
  userMessage: string
  agentResponse: string
  qaScore: number
  qaApproved: boolean
  escalated: boolean
  extractedAmount?: number
  vendor?: string
  project?: string
  qbTransactionId?: string
}): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase.from('sync_logs').insert({
      company_id: entry.companyId,
      entity_type: `agent:${entry.agentName}:${entry.intent}`,
      status: entry.qaApproved ? 'success' : (entry.escalated ? 'error' : 'running'),
      records_synced: entry.extractedAmount ? 1 : 0,
      error_message: entry.escalated ? `QA score ${entry.qaScore}/100 — escalated to human` : null,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Logger] Failed to log transaction:', error)
  }
}

// ==========================================
// Full pipeline: format + send + log
// ==========================================

export async function deliverResponse(
  agentResponse: AgentResponse,
  qaResult: QAResult,
  phone: string,
  intent: Intent,
  targetLanguage: DetectedLanguage,
  companyId: string,
  metadata?: { amount?: number; vendor?: string; project?: string; qbTxnId?: string }
): Promise<void> {
  // Format in user's language
  const formatted = await formatResponse(agentResponse, targetLanguage, intent)

  // Send via WhatsApp
  await sendToWhatsApp(phone, formatted)

  // Log the transaction
  await logTransaction({
    companyId,
    agentName: agentResponse.agentName,
    intent,
    userPhone: phone,
    userMessage: '',
    agentResponse: formatted,
    qaScore: qaResult.score,
    qaApproved: qaResult.approved,
    escalated: qaResult.escalated,
    extractedAmount: metadata?.amount,
    vendor: metadata?.vendor,
    project: metadata?.project,
    qbTransactionId: metadata?.qbTxnId,
  })
}
