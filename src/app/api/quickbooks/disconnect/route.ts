import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { revokeToken } from '@/lib/quickbooks/oauth'

// Disconnect from QuickBooks — revoke tokens and deactivate connection
export async function POST() {
  const profile = await getProfile()
  if (!profile?.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Get active connection to revoke token
  const { data: conn } = await supabase
    .from('qb_connections')
    .select('access_token, refresh_token')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)
    .single()

  if (conn) {
    try {
      await revokeToken(conn.refresh_token)
    } catch (e) {
      console.error('[QB Disconnect] Token revocation failed:', e)
    }
  }

  // Deactivate all connections for this company
  await supabase
    .from('qb_connections')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('company_id', profile.company_id)

  return NextResponse.json({ ok: true })
}
