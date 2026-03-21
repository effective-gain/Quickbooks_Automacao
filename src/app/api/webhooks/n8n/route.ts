import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executeAction, createAction, type ActionType } from '@/lib/eg-os/orchestrator'

// n8n webhook — all n8n workflows route through here
// The orchestrator decides which arm/agent handles each action
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.N8N_WEBHOOK_SECRET

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, data, companyId, projectId } = body

    // Route through EG OS Orchestrator
    const orchestratorActions: Record<string, ActionType> = {
      'document_uploaded': 'check_compliance',
      'whatsapp_audio': 'process_whatsapp_audio',
      'whatsapp_response': 'notify_subcontractor',
      'bank_transaction': 'categorize_transaction',
      'bank_import': 'reconcile_bank',
      'qb_sync': 'sync_quickbooks',
      'send_reminder': 'send_document_reminder',
      'generate_report': 'generate_report',
      'budget_dispatch': 'dispatch_budget',
      'invoice_create': 'create_invoice',
      'run_automation': 'run_automation',
    }

    const actionType = orchestratorActions[action]

    if (actionType) {
      const egAction = createAction(actionType, data || {}, 'n8n', { companyId, projectId })
      const result = await executeAction(egAction)
      return NextResponse.json({ ok: true, orchestrator: result })
    }

    // Fallback: direct database operations for legacy n8n workflows
    const supabase = await createClient()

    switch (action) {
      case 'document_uploaded_legacy': {
        await supabase
          .from('document_requests')
          .update({ status: 'uploaded', file_url: data.file_url, uploaded_at: new Date().toISOString() })
          .eq('id', data.document_id)
        break
      }
      case 'bank_transaction_legacy': {
        await supabase.from('bank_transactions').insert({
          bank_account_id: data.account_id,
          date: data.date,
          description: data.description,
          amount: data.amount,
          is_reconciled: false,
        })
        break
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook error'
    console.error('[n8n Webhook]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
