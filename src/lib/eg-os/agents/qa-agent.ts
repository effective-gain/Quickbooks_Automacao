// ==========================================
// QA AGENT — Quality Assurance
// Validates every output before delivery
// Score >= 70 required. Below = retry.
// After 3 retries = escalate to human.
// Based on EG OS v3 QA specification
// ==========================================

import type { AgentResponse, QAResult, ClassifierOutput } from './types'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

const QA_SYSTEM_PROMPT = `You are a QA Agent for a construction financial management system. You validate agent responses before they reach the user.

SCORE EACH CRITERION (total = 100 points):

1. NOT GENERIC (30 pts): Response references specific data (names, amounts, projects, dates). A generic response scores 0.
2. HAS NEXT STEP (20 pts): Response ends with a concrete action the user can take. Just information = 10. Clear action = 20.
3. CONNECTS TO CONTEXT (25 pts): Response uses context from the conversation (project name, vendor, category). No context = 0.
4. CORRECT FORMAT (15 pts): Response is clear, concise, formatted for WhatsApp (not too long, uses line breaks). Perfect = 15.
5. NO HALLUCINATION (10 pts): No invented data, no assumed amounts, no fabricated vendor names. If uncertain, agent should say so. Perfect = 10.

RESPOND IN JSON:
{
  "approved": true/false (true if total >= 70),
  "score": total_score,
  "criteria": {
    "notGeneric": 0-30,
    "hasNextStep": 0-20,
    "connectsToDNA": 0-25,
    "correctFormat": 0-15,
    "noHallucination": 0-10
  },
  "feedback": "what to improve if score < 70"
}`

export async function validateOutput(
  response: AgentResponse,
  classified: ClassifierOutput,
  retryCount: number = 0
): Promise<QAResult> {
  // Skip QA for simple responses
  if (classified.intent === 'GENERAL' || classified.intent === 'APROVACAO') {
    return {
      approved: true,
      score: 80,
      criteria: { notGeneric: 20, hasNextStep: 15, connectsToDNA: 20, correctFormat: 15, noHallucination: 10 },
      retryCount,
      escalated: false,
    }
  }

  if (!ANTHROPIC_API_KEY) {
    return basicQACheck(response, classified, retryCount)
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
        model: 'claude-sonnet-4-6-20250514',
        max_tokens: 512,
        system: QA_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `AGENT: ${response.agentName}\nINTENT: ${classified.intent}\nUSER INPUT: ${classified.extractedData.description}\n\nAGENT RESPONSE:\n${response.message}`,
        }],
      }),
    })

    if (!res.ok) {
      return basicQACheck(response, classified, retryCount)
    }

    const data = await res.json() as { content: Array<{ text: string }> }
    const text = data.content[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return basicQACheck(response, classified, retryCount)

    const parsed = JSON.parse(jsonMatch[0])

    return {
      approved: parsed.approved || parsed.score >= 70,
      score: parsed.score || 0,
      criteria: {
        notGeneric: parsed.criteria?.notGeneric || 0,
        hasNextStep: parsed.criteria?.hasNextStep || 0,
        connectsToDNA: parsed.criteria?.connectsToDNA || 0,
        correctFormat: parsed.criteria?.correctFormat || 0,
        noHallucination: parsed.criteria?.noHallucination || 0,
      },
      retryCount,
      escalated: retryCount >= 2 && !parsed.approved,
      feedback: parsed.feedback,
    }
  } catch {
    return basicQACheck(response, classified, retryCount)
  }
}

function basicQACheck(
  response: AgentResponse,
  classified: ClassifierOutput,
  retryCount: number
): QAResult {
  const msg = response.message || ''
  let score = 0
  const criteria = { notGeneric: 0, hasNextStep: 0, connectsToDNA: 0, correctFormat: 0, noHallucination: 10 }

  // Not generic: check for specific data
  const hasAmount = /\$[\d,]+/.test(msg)
  const hasName = classified.extractedData.vendor ? msg.includes(classified.extractedData.vendor) : false
  const hasProject = classified.extractedData.project ? msg.includes(classified.extractedData.project) : false

  if (hasAmount) criteria.notGeneric += 15
  if (hasName || hasProject) criteria.notGeneric += 15

  // Has next step
  if (/\?|would you like|want me to|next|confirm|approve/i.test(msg)) criteria.hasNextStep = 20
  else if (msg.length > 20) criteria.hasNextStep = 10

  // Connects to context
  if (classified.extractedData.category && msg.toLowerCase().includes(classified.extractedData.category.toLowerCase())) {
    criteria.connectsToDNA = 25
  } else if (classified.extractedData.description && msg.length > 50) {
    criteria.connectsToDNA = 15
  }

  // Correct format
  if (msg.length < 1000 && msg.length > 10) criteria.correctFormat = 15
  else if (msg.length > 10) criteria.correctFormat = 10

  score = Object.values(criteria).reduce((a, b) => a + b, 0)

  return {
    approved: score >= 70,
    score,
    criteria,
    retryCount,
    escalated: retryCount >= 2 && score < 70,
    feedback: score < 70 ? 'Response needs more specific data and clear next steps' : undefined,
  }
}

// ==========================================
// Retry logic per EG OS v3 spec
// ==========================================

export async function qaWithRetry(
  executeFn: (retryContext?: string) => Promise<AgentResponse>,
  classified: ClassifierOutput,
  maxRetries: number = 2
): Promise<{ response: AgentResponse; qa: QAResult }> {
  let response = await executeFn()
  let qa = await validateOutput(response, classified, 0)

  if (qa.approved) return { response, qa }

  // Retry 1: Add more context
  if (maxRetries >= 1) {
    console.log(`[QA] Score ${qa.score}/100 — retrying with more context`)
    response = await executeFn(`IMPORTANT: Previous response scored ${qa.score}/100. Issues: ${qa.feedback}. Be more specific, use actual data, include next steps.`)
    qa = await validateOutput(response, classified, 1)
    if (qa.approved) return { response, qa }
  }

  // Retry 2: Would use Opus in production, but for now just flag
  if (maxRetries >= 2) {
    console.log(`[QA] Score ${qa.score}/100 — final retry`)
    response = await executeFn(`CRITICAL: Response must include specific amounts, names, and a clear next action. Score needed: 70+.`)
    qa = await validateOutput(response, classified, 2)
  }

  // If still failing, escalate
  if (!qa.approved) {
    qa.escalated = true
    console.warn(`[QA] ESCALATED — Agent ${response.agentName} failed QA after ${maxRetries + 1} attempts. Score: ${qa.score}`)
  }

  return { response, qa }
}
