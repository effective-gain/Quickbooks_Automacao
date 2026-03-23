import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

// GET /api/quickbooks/status — Check QB integration status
export async function GET() {
  const profile = await getProfile()
  if (!profile?.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Get active connection
  const { data: conn } = await supabase
    .from('qb_connections')
    .select('id, realm_id, is_active, token_expires_at, created_at, updated_at')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)
    .single()

  // Get last sync
  const { data: lastSync } = await supabase
    .from('sync_logs')
    .select('entity_type, status, records_synced, started_at, completed_at, error_message')
    .eq('company_id', profile.company_id)
    .order('started_at', { ascending: false })
    .limit(5)

  // Get recent errors
  const { data: recentErrors } = await supabase
    .from('sync_logs')
    .select('entity_type, error_message, started_at')
    .eq('company_id', profile.company_id)
    .eq('status', 'error')
    .order('started_at', { ascending: false })
    .limit(5)

  const tokenExpiresAt = conn?.token_expires_at ? new Date(conn.token_expires_at) : null
  const tokenValid = tokenExpiresAt ? tokenExpiresAt > new Date() : false

  return NextResponse.json({
    connected: !!conn,
    realmId: conn?.realm_id || null,
    tokenValid,
    tokenExpiresAt: conn?.token_expires_at || null,
    connectedSince: conn?.created_at || null,
    lastUpdated: conn?.updated_at || null,
    recentSyncs: lastSync || [],
    recentErrors: recentErrors || [],
  })
}
