// ==========================================
// AGENT 2: LINGUISTA
// Layer 1 — ENTRADA
// Understands any language or mix. Transcribes audio.
// Sub-agents: 2.1 Transcritor, 2.2 Detector, 2.3 Interpretador Mistura, 2.4 Tradutor
// Complexity: HIGH — immigrants mix PT/EN/ES unpredictably
// ==========================================

import type { ReceivedMessage, LinguistOutput, DetectedLanguage } from './types'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''

export async function processLanguage(message: ReceivedMessage): Promise<LinguistOutput> {
  let rawText = ''

  // Sub-agent 2.1: Transcritor — convert audio to text
  if (message.type === 'audio' && (message.audioUrl || message.audioBase64)) {
    rawText = await transcribeAudio(message)
  } else if (message.type === 'image' && message.caption) {
    rawText = message.caption
  } else {
    rawText = message.text || message.caption || ''
  }

  if (!rawText.trim()) {
    return {
      originalText: '',
      cleanText: '',
      translatedText: '',
      detectedLanguage: 'en',
      confidence: 0,
      isCodeSwitching: false,
    }
  }

  // Sub-agent 2.2 + 2.3 + 2.4: Detect language, interpret mixing, translate
  const analysis = await analyzeAndTranslate(rawText)

  console.log(`[Linguista] lang=${analysis.detectedLanguage} mix=${analysis.isCodeSwitching} conf=${analysis.confidence}`)

  return {
    originalText: rawText,
    ...analysis,
  }
}

// ==========================================
// Sub-agent 2.1: Transcritor (Whisper)
// ==========================================

async function transcribeAudio(message: ReceivedMessage): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured')

  let audioBuffer: ArrayBuffer

  if (message.audioUrl) {
    const res = await fetch(message.audioUrl, {
      headers: EVOLUTION_API_KEY ? { apikey: EVOLUTION_API_KEY } : {},
    })
    if (!res.ok) throw new Error(`Failed to download audio: ${res.status}`)
    audioBuffer = await res.arrayBuffer()
  } else if (message.audioBase64) {
    const binary = atob(message.audioBase64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    audioBuffer = bytes.buffer
  } else {
    throw new Error('No audio source provided')
  }

  const formData = new FormData()
  formData.append(
    'file',
    new Blob([new Uint8Array(audioBuffer)], { type: message.mimeType || 'audio/ogg' }),
    'audio.ogg'
  )
  formData.append('model', 'whisper-1')
  // Don't set language — let Whisper auto-detect (supports multilingual)
  formData.append('response_format', 'verbose_json')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Whisper API error: ${err}`)
  }

  const data = await res.json() as { text: string; language?: string }
  return data.text
}

// ==========================================
// Sub-agents 2.2 + 2.3 + 2.4: Detect + Interpret + Translate
// Uses Claude for understanding code-switching
// ==========================================

const LINGUIST_SYSTEM_PROMPT = `You are a specialized linguistic interpreter for a construction financial management system used by immigrant contractors in the USA (primarily Massachusetts).

Your users are Brazilian, Hispanic, and other immigrants who frequently MIX languages in a single sentence. Examples:
- "Gastei trezentos dolar na home depot pra fio eletrico pro projeto da Cedar" (PT+EN)
- "El plumber cobró 2500 por el bathroom de la casa en Oak Street" (ES+EN)
- "Paguei o electrician 4 mil pelo rewiring do basement" (PT+EN)
- "Preciso fazer uma invoice pro cliente de 15 thousand" (PT+EN)
- "Mandei o W-9 do subcontractor novo" (PT+EN)

CONSTRUCTION TERMINOLOGY you must know:
- Trades: plumber, electrician, carpenter, painter, roofer, mason, HVAC, drywall, framing, siding
- Materials: lumber, drywall, wire, pipe, concrete, shingles, insulation, fixtures
- Documents: W-9, COI (Certificate of Insurance), lien waiver, permit, invoice, bill, estimate
- Locations: projects are referenced by street name ("projeto da Cedar", "the Oak Street job")
- Money: "mil" = thousand, "dolar/dolares" = dollars, "conto" = thousand (BR slang)

RESPOND IN THIS EXACT JSON FORMAT:
{
  "cleanText": "normalized text preserving original meaning",
  "translatedText": "complete English translation, formal, suitable for accounting records",
  "detectedLanguage": "en" | "pt" | "es" | "mixed",
  "confidence": 0.0 to 1.0,
  "isCodeSwitching": true | false
}`

async function analyzeAndTranslate(text: string): Promise<Omit<LinguistOutput, 'originalText'>> {
  if (!ANTHROPIC_API_KEY) {
    // Fallback: basic detection without Claude
    return fallbackAnalysis(text)
  }

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
        system: LINGUIST_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: text }],
      }),
    })

    if (!res.ok) {
      console.error(`[Linguista] Claude API error: ${res.status}`)
      return fallbackAnalysis(text)
    }

    const data = await res.json() as {
      content: Array<{ type: string; text: string }>
    }

    const responseText = data.content[0]?.text || ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return fallbackAnalysis(text)

    const parsed = JSON.parse(jsonMatch[0]) as {
      cleanText: string
      translatedText: string
      detectedLanguage: DetectedLanguage
      confidence: number
      isCodeSwitching: boolean
    }

    return {
      cleanText: parsed.cleanText || text,
      translatedText: parsed.translatedText || text,
      detectedLanguage: parsed.detectedLanguage || 'en',
      confidence: parsed.confidence || 0.5,
      isCodeSwitching: parsed.isCodeSwitching || false,
    }
  } catch (error) {
    console.error('[Linguista] Claude call failed:', error)
    return fallbackAnalysis(text)
  }
}

function fallbackAnalysis(text: string): Omit<LinguistOutput, 'originalText'> {
  const ptWords = /\b(gastei|paguei|preciso|fazer|projeto|obra|mandei|fatura|conta|valor)\b/i
  const esWords = /\b(cobró|pagué|necesito|hacer|proyecto|obra|factura|cuenta|valor)\b/i
  const enWords = /\b(spent|paid|need|make|project|invoice|bill|amount|cost)\b/i

  const hasPt = ptWords.test(text)
  const hasEs = esWords.test(text)
  const hasEn = enWords.test(text)

  const mixed = (hasPt && hasEn) || (hasEs && hasEn) || (hasPt && hasEs)
  let lang: DetectedLanguage = 'en'
  if (mixed) lang = 'mixed'
  else if (hasPt) lang = 'pt'
  else if (hasEs) lang = 'es'

  return {
    cleanText: text,
    translatedText: text, // can't translate without Claude
    detectedLanguage: lang,
    confidence: mixed ? 0.6 : 0.8,
    isCodeSwitching: mixed,
  }
}
