// ==========================================
// AGENT 1: RECEPTOR
// Layer 1 — ENTRADA
// Receives all WhatsApp messages, normalizes
// Sub-agents: 1.1 Text, 1.2 Audio, 1.3 Image, 1.4 Document
// Complexity: LOW
// ==========================================

import type { ReceivedMessage, MessageType } from './types'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''

export async function processIncoming(webhookData: Record<string, unknown>): Promise<ReceivedMessage> {
  const data = webhookData.data as Record<string, unknown> | undefined
  if (!data) throw new Error('No data in webhook payload')

  const key = data.key as Record<string, string> | undefined
  const message = data.message as Record<string, unknown> | undefined
  const messageType = (data.messageType as string) || 'conversation'

  const from = key?.remoteJid?.replace('@s.whatsapp.net', '') || ''
  const id = key?.id || crypto.randomUUID()
  const timestamp = new Date().toISOString()

  const type = detectMessageType(messageType)

  const received: ReceivedMessage = { id, from, type, timestamp }

  switch (type) {
    case 'text':
      received.text = extractText(message, messageType)
      break

    case 'audio':
      received.audioUrl = await extractMediaUrl(data)
      received.mimeType = extractMimeType(message, 'audioMessage') || 'audio/ogg'
      break

    case 'image':
      received.imageUrl = await extractMediaUrl(data)
      received.caption = extractCaption(message, 'imageMessage')
      received.mimeType = extractMimeType(message, 'imageMessage') || 'image/jpeg'
      break

    case 'document':
      received.documentUrl = await extractMediaUrl(data)
      received.fileName = extractFileName(message)
      received.caption = extractCaption(message, 'documentMessage')
      received.mimeType = extractMimeType(message, 'documentMessage') || 'application/pdf'
      break
  }

  console.log(`[Receptor] ${type} from ${from} | id: ${id}`)
  return received
}

function detectMessageType(messageType: string): MessageType {
  switch (messageType) {
    case 'audioMessage':
    case 'pttMessage':
      return 'audio'
    case 'imageMessage':
      return 'image'
    case 'documentMessage':
      return 'document'
    default:
      return 'text'
  }
}

function extractText(message: Record<string, unknown> | undefined, messageType: string): string {
  if (!message) return ''
  if (messageType === 'conversation') return (message.conversation as string) || ''
  if (messageType === 'extendedTextMessage') {
    const ext = message.extendedTextMessage as Record<string, string> | undefined
    return ext?.text || ''
  }
  return ''
}

async function extractMediaUrl(data: Record<string, unknown>): Promise<string | undefined> {
  const directUrl = (data as Record<string, string>).mediaUrl
  if (directUrl) return directUrl

  const message = data.message as Record<string, unknown> | undefined
  if (!message) return undefined
  return (message.mediaUrl as string) || undefined
}

function extractMimeType(message: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!message) return undefined
  const sub = message[key] as Record<string, string> | undefined
  return sub?.mimetype
}

function extractCaption(message: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!message) return undefined
  const sub = message[key] as Record<string, string> | undefined
  return sub?.caption
}

function extractFileName(message: Record<string, unknown> | undefined): string | undefined {
  if (!message) return undefined
  const doc = message.documentMessage as Record<string, string> | undefined
  return doc?.fileName
}
