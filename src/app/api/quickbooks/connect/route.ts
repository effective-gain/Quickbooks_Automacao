import { NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/lib/quickbooks/oauth'
import { requireAuth } from '@/lib/auth'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'

export async function GET() {
  await requireAuth()

  // Generate CSRF state and store in httpOnly cookie
  const state = randomUUID()
  const cookieStore = await cookies()
  cookieStore.set('qb_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  const url = await getAuthorizationUrl(state)
  return NextResponse.redirect(url)
}
