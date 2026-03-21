import { NextRequest, NextResponse } from 'next/server'
import { executeAction, createAction } from '@/lib/eg-os/orchestrator'

// Webhook from Evolution API (WhatsApp)
// Receives messages, audio, documents from subcontractors
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('apikey') || request.headers.get('authorization')
  const expectedKey = process.env.EVOLUTION_WEBHOOK_SECRET

  if (expectedKey && authHeader !== expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Evolution API webhook structure
    const event = body.event
    const data = body.data

    if (!data) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const fromPhone = data.key?.remoteJid?.replace('@s.whatsapp.net', '') || ''
    const messageType = data.messageType || 'text'

    // Handle different message types
    switch (messageType) {
      case 'audioMessage':
      case 'pttMessage': {
        // Audio message → Whisper transcription → structured data → QB
        const action = createAction(
          'process_whatsapp_audio',
          {
            audioUrl: data.message?.mediaUrl || data.mediaUrl,
            audioBase64: data.message?.base64,
            mimeType: data.message?.audioMessage?.mimetype || 'audio/ogg',
            fromPhone,
            messageId: data.key?.id,
          },
          'whatsapp'
        )

        const result = await executeAction(action)
        return NextResponse.json({ ok: true, processed: true, result: result.data })
      }

      case 'imageMessage':
      case 'documentMessage': {
        // Document/image → could be insurance, W9, etc.
        const action = createAction(
          'check_compliance',
          {
            fromPhone,
            fileUrl: data.message?.mediaUrl || data.mediaUrl,
            fileName: data.message?.documentMessage?.fileName,
            mimeType: data.message?.documentMessage?.mimetype || data.message?.imageMessage?.mimetype,
            caption: data.message?.documentMessage?.caption || data.message?.imageMessage?.caption,
          },
          'whatsapp'
        )

        const result = await executeAction(action)
        return NextResponse.json({ ok: true, processed: true, result: result.data })
      }

      case 'conversation':
      case 'extendedTextMessage': {
        // Text message — log for now, could be parsed for intent
        const text = data.message?.conversation || data.message?.extendedTextMessage?.text || ''
        console.log(`[WhatsApp] Text from ${fromPhone}: ${text}`)

        return NextResponse.json({ ok: true, type: 'text', from: fromPhone })
      }

      default:
        return NextResponse.json({ ok: true, skipped: true, type: messageType })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook error'
    console.error('[WhatsApp Webhook]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
