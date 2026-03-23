// ==========================================
// EG OS — Tracing & Observability
// Correlation ID, idempotency, execution logging
// ==========================================

import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'

// ==========================================
// Correlation ID
// ==========================================

export function generateCorrelationId(): string {
  return randomUUID()
}

// ==========================================
// Idempotency Check (replay protection)
// ==========================================

export async function checkIdempotency(
  source: string,
  messageId: string
): Promise<{ isDuplicate: boolean; existingEventId?: string }> {
  if (!messageId) return { isDuplicate: false }

  const supabase = await createClient()

  const { data } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('source', source)
    .eq('payload->>messageId', messageId)
    .maybeSingle()

  if (data) {
    return { isDuplicate: true, existingEventId: data.id }
  }

  return { isDuplicate: false }
}

// ==========================================
// Log Webhook Event
// ==========================================

export async function logWebhookEvent(params: {
  correlationId: string
  companyId?: string
  source: string
  eventType: string
  payload: Record<string, unknown>
  status?: string
}) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('webhook_events')
    .insert({
      correlation_id: params.correlationId,
      company_id: params.companyId || null,
      source: params.source,
      event_type: params.eventType,
      payload: params.payload,
      status: params.status || 'received',
    })
    .select('id')
    .single()

  return data?.id
}

export async function updateWebhookEvent(id: string, status: string, errorMessage?: string) {
  const supabase = await createClient()
  await supabase
    .from('webhook_events')
    .update({
      status,
      error_message: errorMessage || null,
      processed_at: new Date().toISOString(),
    })
    .eq('id', id)
}

// ==========================================
// Log Orchestrator Run
// ==========================================

export async function logOrchestratorRun(params: {
  correlationId: string
  webhookEventId?: string
  companyId?: string
  eventType: string
  actionType: string
  arm: string
  agentCalled: string
}) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('orchestrator_runs')
    .insert({
      correlation_id: params.correlationId,
      webhook_event_id: params.webhookEventId || null,
      company_id: params.companyId || null,
      event_type: params.eventType,
      action_type: params.actionType,
      arm: params.arm,
      agent_called: params.agentCalled,
      status: 'started',
    })
    .select('id')
    .single()

  return data?.id
}

export async function completeOrchestratorRun(
  id: string,
  status: 'success' | 'error',
  durationMs: number,
  errorMessage?: string
) {
  const supabase = await createClient()
  await supabase
    .from('orchestrator_runs')
    .update({
      status,
      duration_ms: durationMs,
      error_message: errorMessage || null,
    })
    .eq('id', id)
}

// ==========================================
// Log Agent Run
// ==========================================

export async function logAgentRun(params: {
  orchestratorRunId?: string
  agentName: string
  companyId?: string
  input: Record<string, unknown>
  output: Record<string, unknown>
  status: 'success' | 'error' | 'need_more_data'
  intuitTid?: string
  durationMs: number
  errorMessage?: string
}) {
  const supabase = await createClient()

  await supabase.from('agent_runs').insert({
    orchestrator_run_id: params.orchestratorRunId || null,
    agent_name: params.agentName,
    company_id: params.companyId || null,
    input: params.input,
    output: params.output,
    status: params.status,
    intuit_tid: params.intuitTid || null,
    duration_ms: params.durationMs,
    error_message: params.errorMessage || null,
  })
}

// ==========================================
// Audit Log
// ==========================================

export async function createAuditLog(params: {
  companyId?: string
  userId?: string
  action: string
  resourceType: string
  resourceId?: string
  changes?: Record<string, unknown>
  ipAddress?: string
}) {
  const supabase = await createClient()
  await supabase.from('audit_logs').insert(params)
}

// ==========================================
// Retry with Exponential Backoff
// ==========================================

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  const { maxRetries = 5, baseDelayMs = 1000, label = 'operation' } = options

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const isLastAttempt = attempt === maxRetries
      const message = error instanceof Error ? error.message : 'Unknown error'

      if (isLastAttempt) {
        console.error(`[Retry] ${label} failed after ${maxRetries + 1} attempts: ${message}`)
        throw error
      }

      // Don't retry on 4xx errors (except 429)
      if (error instanceof Error && 'statusCode' in error) {
        const statusCode = (error as { statusCode: number }).statusCode
        if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
          throw error
        }
      }

      const delay = baseDelayMs * Math.pow(2, attempt)
      console.warn(`[Retry] ${label} attempt ${attempt + 1} failed, retrying in ${delay}ms: ${message}`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error('Unreachable')
}
