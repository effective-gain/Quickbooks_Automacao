import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

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
    // Revoke token at Intuit
    try {
      const credentials = Buffer.from(
        `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
      ).toString('base64')

      await fetch('https://developer.api.intuit.com/v2/oauth2/tokens/revoke', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ token: conn.refresh_token }),
      })
    } catch (e) {
      console.error('Token revocation failed:', e)
    }
  }

  // Deactivate all connections for this company
  await supabase
    .from('qb_connections')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('company_id', profile.company_id)

  return NextResponse.json({ ok: true })
}
