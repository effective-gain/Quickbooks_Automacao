import { NextRequest, NextResponse } from 'next/server'
import { runPipeline } from '@/lib/eg-os/agents/pipeline'

// ==========================================
// WhatsApp Webhook — Evolution API
// ALL messages flow through the 3-layer agent pipeline:
// ENTRADA (Receptor → Linguista → Classificador)
// EXECUÇÃO (Contador / Faturista / Contas a Pagar)
// INTELIGÊNCIA (Fiscal / Compliance / Comunicador + QA)
// ==========================================

// Default company ID — in production, resolve from phone number
const DEFAULT_COMPANY_ID = process.env.DEFAULT_COMPANY_ID || ''

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('apikey') || request.headers.get('authorization')
  const expectedKey = process.env.EVOLUTION_WEBHOOK_SECRET

  if (expectedKey && authHeader !== expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (!body.data) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Run the full agent pipeline
    const result = await runPipeline(body, DEFAULT_COMPANY_ID)

    return NextResponse.json({
      ok: true,
      intent: result.intent,
      qaScore: result.qaScore,
      escalated: result.escalated,
      success: result.success,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook error'
    console.error('[WhatsApp Pipeline]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
