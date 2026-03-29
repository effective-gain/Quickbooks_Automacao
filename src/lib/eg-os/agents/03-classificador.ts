// ==========================================
// AGENT 3: CLASSIFICADOR
// Layer 1 — ENTRADA
// Classifies intent + extracts structured data
// Sub-agents: 3.1 Intent, 3.2 Data Extractor, 3.3 Account Mapper
// Complexity: VERY HIGH — this is the BRAIN
// ==========================================

import type { LinguistOutput, ClassifierOutput, Intent, ExtractedData } from './types'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

const CLASSIFIER_SYSTEM_PROMPT = `You are the BRAIN of a construction financial management system. You classify user intent and extract structured data from messages sent by immigrant contractors in the USA.

## INTENTS (classify as exactly one):

1. **DESPESA** — User reports an expense they paid
   Examples: "Spent $300 at Home Depot", "Paguei 2500 pro plumber", "Gastei no lumber"

2. **INVOICE** — User wants to create/send an invoice to their CLIENT
   Examples: "Faz uma invoice pro John de 15 mil", "Invoice the Smith project for framing"

3. **BILL** — User received an invoice FROM a subcontractor (accounts payable)
   Examples: "O electrician mandou uma nota de 4500", "Got a bill from ABC Plumbing"

4. **CONSULTA** — User wants to check something (balance, status, report)
   Examples: "Quanto gastei no projeto Cedar?", "What's my balance?", "How much did I pay to subs this month?"

5. **CHANGE_ORDER** — User reports a change to project scope
   Examples: "O cliente pediu pra adicionar um bathroom", "Change order: extra framing work"

6. **COTACAO** — User wants a quote/estimate
   Examples: "Preciso fazer um orçamento pro cliente", "Quote for kitchen remodel"

7. **FOTO** — User sent a photo (receipt, invoice, document)
   Note: When paired with image, classify based on the IMAGE CONTENT described in caption

8. **APROVACAO** — User is approving or rejecting something
   Examples: "Aprovado", "Go ahead", "Não, cancela", "Reject that bill"

9. **GENERAL** — None of the above / greeting / unclear
   Examples: "Oi", "Hello", "What can you do?"

## EXTRACTION RULES:

- **amount**: Extract dollar amounts. "trezentos dolar" = 300, "2 mil" = 2000, "15 thousand" = 15000, "2500" = 2500
- **vendor**: The person/company being PAID (for DESPESA/BILL). "Home Depot", "o plumber", "ABC Electric"
- **customer**: The person/company being BILLED (for INVOICE). "John", "the Smith project client"
- **project**: Referenced by street name, client name, or project name. "Cedar", "Oak Street", "Smith kitchen"
- **category**: Map to construction category:
  - General Conditions, Site Work, Concrete/Foundation, Masonry, Metals/Steel
  - Carpentry/Framing, Thermal/Moisture (insulation, roofing), Doors/Windows
  - Finishes (drywall, paint, flooring, tile), Specialties
  - Mechanical (HVAC), Plumbing, Electrical, Equipment
  - Materials, Labor, Permits/Fees, Insurance
- **description**: Clear English description for accounting records

## RESPONSE FORMAT (strict JSON):

{
  "intent": "DESPESA" | "INVOICE" | "BILL" | "CONSULTA" | "CHANGE_ORDER" | "COTACAO" | "FOTO" | "APROVACAO" | "GENERAL",
  "confidence": 0.0 to 1.0,
  "extractedData": {
    "amount": number or null,
    "vendor": "string" or null,
    "customer": "string" or null,
    "project": "string" or null,
    "category": "string" or null,
    "invoiceNumber": "string" or null,
    "description": "string (always in English)",
    "date": "YYYY-MM-DD" or null,
    "items": [{"description": "string", "quantity": number, "unitPrice": number}] or null,
    "documentType": "W-9" | "COI" | "License" | "Lien Waiver" or null
  },
  "reasoning": "brief explanation of classification"
}`

export async function classifyMessage(
  linguistOutput: LinguistOutput,
  imageDescription?: string
): Promise<ClassifierOutput> {
  if (!ANTHROPIC_API_KEY) {
    return fallbackClassify(linguistOutput)
  }

  // Build the message for Claude
  let userMessage = `TRANSLATED TEXT: ${linguistOutput.translatedText}`
  if (linguistOutput.originalText !== linguistOutput.translatedText) {
    userMessage += `\nORIGINAL: ${linguistOutput.originalText}`
  }
  userMessage += `\nLANGUAGE: ${linguistOutput.detectedLanguage}`
  if (imageDescription) {
    userMessage += `\nIMAGE DESCRIPTION: ${imageDescription}`
  }
  userMessage += `\nTODAY: ${new Date().toISOString().split('T')[0]}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6-20250514',
        max_tokens: 1024,
        system: CLASSIFIER_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!res.ok) {
      console.error(`[Classificador] Claude API error: ${res.status}`)
      return fallbackClassify(linguistOutput)
    }

    const data = await res.json() as {
      content: Array<{ type: string; text: string }>
    }

    const responseText = data.content[0]?.text || ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return fallbackClassify(linguistOutput)

    const parsed = JSON.parse(jsonMatch[0])

    return {
      intent: validateIntent(parsed.intent),
      confidence: parsed.confidence || 0.5,
      extractedData: {
        amount: parsed.extractedData?.amount ?? null,
        vendor: parsed.extractedData?.vendor ?? null,
        customer: parsed.extractedData?.customer ?? null,
        project: parsed.extractedData?.project ?? null,
        category: parsed.extractedData?.category ?? null,
        invoiceNumber: parsed.extractedData?.invoiceNumber ?? null,
        description: parsed.extractedData?.description || linguistOutput.translatedText,
        date: parsed.extractedData?.date ?? null,
        items: parsed.extractedData?.items ?? null,
        documentType: parsed.extractedData?.documentType ?? null,
      },
      rawReasoning: parsed.reasoning,
    }
  } catch (error) {
    console.error('[Classificador] Claude call failed:', error)
    return fallbackClassify(linguistOutput)
  }
}

function validateIntent(raw: string): Intent {
  const valid: Intent[] = ['DESPESA', 'INVOICE', 'BILL', 'CONSULTA', 'CHANGE_ORDER', 'COTACAO', 'FOTO', 'APROVACAO', 'GENERAL']
  const upper = (raw || '').toUpperCase() as Intent
  return valid.includes(upper) ? upper : 'GENERAL'
}

function fallbackClassify(linguistOutput: LinguistOutput): ClassifierOutput {
  const text = linguistOutput.translatedText.toLowerCase()

  let intent: Intent = 'GENERAL'
  if (/spent|paid|cost|expense|gastei|paguei|comprei/.test(text)) intent = 'DESPESA'
  else if (/invoice|fatura|bill.*client|cobrar/.test(text)) intent = 'INVOICE'
  else if (/bill|nota|received.*invoice|mandou.*nota/.test(text)) intent = 'BILL'
  else if (/how much|balance|quanto|report|status/.test(text)) intent = 'CONSULTA'
  else if (/change order|adicionar|extra|mudou/.test(text)) intent = 'CHANGE_ORDER'
  else if (/quote|estimate|orçamento|cotação/.test(text)) intent = 'COTACAO'
  else if (/approv|ok|go ahead|aprovado|reject|cancel/.test(text)) intent = 'APROVACAO'

  const amountMatch = text.match(/\$?([\d,]+(?:\.\d{2})?)\s*(?:dolar|dollar|mil|thousand|k)?/i)
  let amount: number | undefined
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(',', ''))
    if (/mil|thousand|k/i.test(text)) amount *= 1000
  }

  return {
    intent,
    confidence: 0.4,
    extractedData: {
      amount,
      description: linguistOutput.translatedText,
    },
  }
}
