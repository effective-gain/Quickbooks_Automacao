import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/quickbooks/oauth'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const realmId = searchParams.get('realmId')

  if (!code || !realmId) {
    return NextResponse.redirect(new URL('/quickbooks?error=missing_params', request.url))
  }

  try {
    const profile = await getProfile()
    if (!profile?.company_id) {
      return NextResponse.redirect(new URL('/quickbooks?error=no_company', request.url))
    }

    const tokens = await exchangeCodeForTokens(code)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const supabase = await createClient()

    // Deactivate existing connections
    await supabase
      .from('qb_connections')
      .update({ is_active: false })
      .eq('company_id', profile.company_id)

    // Create new connection
    await supabase.from('qb_connections').insert({
      company_id: profile.company_id,
      realm_id: realmId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt,
      is_active: true,
    })

    return NextResponse.redirect(new URL('/quickbooks?connected=true', request.url))
  } catch (error) {
    console.error('QB callback error:', error)
    return NextResponse.redirect(new URL('/quickbooks?error=token_exchange', request.url))
  }
}
