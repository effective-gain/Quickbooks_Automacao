import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth'
import { syncAll } from '@/lib/quickbooks/sync'

export async function POST() {
  const profile = await getProfile()
  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company' }, { status: 400 })
  }

  try {
    const results = await syncAll(profile.company_id)
    return NextResponse.json({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
