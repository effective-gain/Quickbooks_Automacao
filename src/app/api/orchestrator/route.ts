import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth'
import { executeAction, executeChain, createAction, type ActionType } from '@/lib/eg-os/orchestrator'

// POST /api/orchestrator — Single action
// POST /api/orchestrator?chain=true — Chain of actions
export async function POST(request: NextRequest) {
  const profile = await getProfile()
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isChain = request.nextUrl.searchParams.get('chain') === 'true'
  const body = await request.json()

  const context = {
    userId: profile.id,
    companyId: profile.company_id || undefined,
  }

  if (isChain) {
    // Chain mode: { actions: [{ type, payload, projectId? }] }
    const actions = (body.actions as { type: ActionType; payload: Record<string, unknown>; projectId?: string }[]).map(a =>
      createAction(a.type, a.payload, 'app', { ...context, projectId: a.projectId })
    )
    const results = await executeChain(actions)
    return NextResponse.json({ results })
  }

  // Single action mode: { type, payload, projectId? }
  const action = createAction(
    body.type as ActionType,
    body.payload || {},
    'app',
    { ...context, projectId: body.projectId }
  )

  const result = await executeAction(action)

  if (!result.success) {
    return NextResponse.json({ error: result.error, arm: result.arm, agent: result.agent }, { status: 500 })
  }

  return NextResponse.json(result)
}
