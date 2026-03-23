import { NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/lib/quickbooks/oauth'
import { requireAuth } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function GET() {
  await requireAuth()
  const state = randomUUID()
  const url = await getAuthorizationUrl(state)
  return NextResponse.redirect(url)
}
