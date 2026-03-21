// ==========================================
// EG OS — Orchestrator Central
// Every action flows through here first.
// Routes to the correct arm/agent with minimum context.
// ==========================================

export type EGArm =
  | 'system-brain'
  | 'operations'
  | 'strategy'
  | 'technology'
  | 'legal-compliance'
  | 'cx'
  | 'marketing'
  | 'hr'
  | 'product'
  | 'communications'

export type ActionType =
  // System Brain
  | 'orchestrate'
  | 'diagnose'
  // Operations & Supply Chain
  | 'create_cost_entry'
  | 'categorize_transaction'
  | 'process_takeoff'
  | 'dispatch_budget'
  | 'sync_quickbooks'
  | 'reconcile_bank'
  // Strategy
  | 'track_kpi'
  | 'generate_report'
  | 'calculate_roi'
  // Technology
  | 'trigger_n8n_workflow'
  | 'process_whatsapp_audio'
  | 'run_automation'
  // Legal & Compliance
  | 'request_document'
  | 'check_compliance'
  | 'send_document_reminder'
  // CX
  | 'notify_subcontractor'
  | 'send_whatsapp'
  | 'send_email'
  // Invoicing (cross-arm)
  | 'create_invoice'
  | 'send_invoice'
  | 'mark_invoice_paid'

export interface OrchestratorAction {
  type: ActionType
  payload: Record<string, unknown>
  source: 'app' | 'whatsapp' | 'n8n' | 'webhook' | 'cron' | 'notion'
  userId?: string
  companyId?: string
  projectId?: string
  timestamp: string
}

export interface OrchestratorResult {
  success: boolean
  arm: EGArm
  agent: string
  data?: unknown
  error?: string
  nextActions?: ActionType[]
}

// Action → Arm routing table
const ACTION_ROUTING: Record<ActionType, { arm: EGArm; agent: string }> = {
  // System Brain
  orchestrate: { arm: 'system-brain', agent: 'Orchestrator' },
  diagnose: { arm: 'system-brain', agent: 'Diagnostics' },
  // Operations
  create_cost_entry: { arm: 'operations', agent: 'CostController' },
  categorize_transaction: { arm: 'operations', agent: 'AutoCategorizer' },
  process_takeoff: { arm: 'operations', agent: 'TakeoffProcessor' },
  dispatch_budget: { arm: 'operations', agent: 'BudgetDispatcher' },
  sync_quickbooks: { arm: 'operations', agent: 'QBSyncAgent' },
  reconcile_bank: { arm: 'operations', agent: 'BankReconciler' },
  // Strategy
  track_kpi: { arm: 'strategy', agent: 'KPITracker' },
  generate_report: { arm: 'strategy', agent: 'ReportGenerator' },
  calculate_roi: { arm: 'strategy', agent: 'ROICalculator' },
  // Technology
  trigger_n8n_workflow: { arm: 'technology', agent: 'N8NTrigger' },
  process_whatsapp_audio: { arm: 'technology', agent: 'WhisperTranscriber' },
  run_automation: { arm: 'technology', agent: 'AutomationRunner' },
  // Legal & Compliance
  request_document: { arm: 'legal-compliance', agent: 'DocumentRequester' },
  check_compliance: { arm: 'legal-compliance', agent: 'ComplianceChecker' },
  send_document_reminder: { arm: 'legal-compliance', agent: 'ReminderAgent' },
  // CX
  notify_subcontractor: { arm: 'cx', agent: 'SubNotifier' },
  send_whatsapp: { arm: 'cx', agent: 'WhatsAppAgent' },
  send_email: { arm: 'cx', agent: 'EmailAgent' },
  // Cross-arm
  create_invoice: { arm: 'operations', agent: 'InvoiceCreator' },
  send_invoice: { arm: 'cx', agent: 'InvoiceSender' },
  mark_invoice_paid: { arm: 'operations', agent: 'PaymentRecorder' },
}

export function routeAction(action: OrchestratorAction): { arm: EGArm; agent: string } {
  const route = ACTION_ROUTING[action.type]
  if (!route) {
    return { arm: 'system-brain', agent: 'Orchestrator' }
  }
  return route
}

export async function executeAction(action: OrchestratorAction): Promise<OrchestratorResult> {
  const route = routeAction(action)

  console.log(`[EG OS] ${route.arm}/${route.agent} ← ${action.type} from ${action.source}`)

  try {
    // Dynamic dispatch to arm handlers
    const handler = await getArmHandler(route.arm)
    const result = await handler(action, route.agent)

    return {
      success: true,
      arm: route.arm,
      agent: route.agent,
      data: result.data,
      nextActions: result.nextActions,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[EG OS] ERROR ${route.arm}/${route.agent}: ${message}`)

    return {
      success: false,
      arm: route.arm,
      agent: route.agent,
      error: message,
    }
  }
}

// Chain multiple actions (orchestrator pattern)
export async function executeChain(actions: OrchestratorAction[]): Promise<OrchestratorResult[]> {
  const results: OrchestratorResult[] = []

  for (const action of actions) {
    const result = await executeAction(action)
    results.push(result)

    // If an action fails, stop the chain
    if (!result.success) break

    // If the result suggests next actions, they can be queued
    // (but not auto-executed — the caller decides)
  }

  return results
}

// Arm handler registry
type ArmHandler = (action: OrchestratorAction, agent: string) => Promise<{ data?: unknown; nextActions?: ActionType[] }>

async function getArmHandler(arm: EGArm): Promise<ArmHandler> {
  switch (arm) {
    case 'operations':
      return (await import('./arms/operations')).handleOperations
    case 'technology':
      return (await import('./arms/technology')).handleTechnology
    case 'legal-compliance':
      return (await import('./arms/legal-compliance')).handleLegalCompliance
    case 'cx':
      return (await import('./arms/cx')).handleCX
    case 'strategy':
      return (await import('./arms/strategy')).handleStrategy
    default:
      return async () => ({ data: { message: `Arm ${arm} not yet implemented` } })
  }
}

// Helper to create an action
export function createAction(
  type: ActionType,
  payload: Record<string, unknown>,
  source: OrchestratorAction['source'],
  context?: { userId?: string; companyId?: string; projectId?: string }
): OrchestratorAction {
  return {
    type,
    payload,
    source,
    userId: context?.userId,
    companyId: context?.companyId,
    projectId: context?.projectId,
    timestamp: new Date().toISOString(),
  }
}
