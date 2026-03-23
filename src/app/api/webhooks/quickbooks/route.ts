import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { executeAction, createAction } from '@/lib/eg-os/orchestrator'
import { createClient } from '@/lib/supabase/server'

const QB_WEBHOOK_VERIFIER_TOKEN = process.env.QB_WEBHOOK_VERIFIER_TOKEN || ''

// ==========================================
// QuickBooks Webhook Endpoint
// Receives real-time notifications for entity changes
// HMAC-SHA256 signature verification required
// ==========================================

// GET — Intuit verification challenge
export async function GET() {
  // Intuit may send a GET to verify the endpoint is alive
  return NextResponse.json({ ok: true })
}

// POST — Webhook events
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('intuit-signature')

  // Step 1: Verify HMAC-SHA256 signature
  if (!verifySignature(rawBody, signature)) {
    console.error('[QB Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Step 2: Parse and process events
  try {
    const payload = JSON.parse(rawBody) as QBWebhookPayload

    for (const notification of payload.eventNotifications || []) {
      const realmId = notification.realmId

      for (const event of notification.dataChangeEvent?.entities || []) {
        await processWebhookEvent(realmId, event)
      }
    }

    // Always return 200 quickly — Intuit retries on non-200
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[QB Webhook] Processing error:', error)
    // Still return 200 to prevent Intuit from retrying
    return NextResponse.json({ ok: true })
  }
}

// ==========================================
// HMAC-SHA256 Verification
// ==========================================

function verifySignature(payload: string, signature: string | null): boolean {
  if (!QB_WEBHOOK_VERIFIER_TOKEN || !signature) return false

  try {
    const hash = createHmac('sha256', QB_WEBHOOK_VERIFIER_TOKEN)
      .update(payload)
      .digest('base64')

    const hashBuffer = Buffer.from(hash)
    const signatureBuffer = Buffer.from(signature)

    if (hashBuffer.length !== signatureBuffer.length) return false

    return timingSafeEqual(hashBuffer, signatureBuffer)
  } catch {
    return false
  }
}

// ==========================================
// Event Processing
// ==========================================

async function processWebhookEvent(realmId: string, event: QBWebhookEntity) {
  console.log(`[QB Webhook] ${event.operation} ${event.name} (id: ${event.id}) in realm ${realmId}`)

  const supabase = await createClient()

  // Find the company by realm_id
  const { data: connection } = await supabase
    .from('qb_connections')
    .select('company_id')
    .eq('realm_id', realmId)
    .eq('is_active', true)
    .single()

  if (!connection) {
    console.warn(`[QB Webhook] No active connection for realm ${realmId}`)
    return
  }

  // Log the webhook event
  await supabase.from('sync_logs').insert({
    company_id: connection.company_id,
    entity_type: `webhook:${event.name}:${event.operation}`,
    status: 'success',
    records_synced: 1,
    started_at: event.lastUpdated,
    completed_at: new Date().toISOString(),
  })

  // Route through orchestrator based on entity type and operation
  const actionMap: Record<string, Record<string, () => Promise<void>>> = {
    Invoice: {
      Create: async () => {
        await executeAction(createAction('track_kpi', {
          entity: 'Invoice', operation: 'Create', qbId: event.id, realmId,
        }, 'webhook', { companyId: connection.company_id }))
      },
      Update: async () => {
        await executeAction(createAction('track_kpi', {
          entity: 'Invoice', operation: 'Update', qbId: event.id, realmId,
        }, 'webhook', { companyId: connection.company_id }))
      },
      Void: async () => {
        await executeAction(createAction('track_kpi', {
          entity: 'Invoice', operation: 'Void', qbId: event.id, realmId,
        }, 'webhook', { companyId: connection.company_id }))
      },
    },
    Payment: {
      Create: async () => {
        await executeAction(createAction('track_kpi', {
          entity: 'Payment', operation: 'Create', qbId: event.id, realmId,
        }, 'webhook', { companyId: connection.company_id }))
      },
    },
    Bill: {
      Create: async () => {
        await executeAction(createAction('categorize_transaction', {
          entity: 'Bill', qbId: event.id, realmId,
        }, 'webhook', { companyId: connection.company_id }))
      },
    },
    Purchase: {
      Create: async () => {
        await executeAction(createAction('categorize_transaction', {
          entity: 'Purchase', qbId: event.id, realmId,
        }, 'webhook', { companyId: connection.company_id }))
      },
    },
    Vendor: {
      Create: async () => {
        await executeAction(createAction('check_compliance', {
          entity: 'Vendor', qbId: event.id, realmId,
        }, 'webhook', { companyId: connection.company_id }))
      },
    },
  }

  const handler = actionMap[event.name]?.[event.operation]
  if (handler) await handler()
}

// ==========================================
// Types
// ==========================================

interface QBWebhookPayload {
  eventNotifications: {
    realmId: string
    dataChangeEvent: {
      entities: QBWebhookEntity[]
    }
  }[]
}

interface QBWebhookEntity {
  name: string // 'Invoice', 'Customer', 'Vendor', 'Bill', etc.
  id: string
  operation: 'Create' | 'Update' | 'Delete' | 'Merge' | 'Void'
  lastUpdated: string
  deletedId?: string
}
