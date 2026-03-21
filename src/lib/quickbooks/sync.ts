import { createClient } from '@/lib/supabase/server'
import { getAccounts, getCustomers, getVendors, queryQB } from './client'
import { refreshAccessToken } from './oauth'

interface ConnectionTokens {
  realmId: string
  accessToken: string
  refreshToken: string
  tokenExpiresAt: string
  connectionId: string
}

export async function getActiveConnection(companyId: string): Promise<ConnectionTokens | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('qb_connections')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .single()

  if (!data) return null

  // Check if token is expired, refresh if needed
  const expiresAt = new Date(data.token_expires_at)
  const now = new Date()

  if (expiresAt <= now) {
    const tokens = await refreshAccessToken(data.refresh_token)
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await supabase
      .from('qb_connections')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)

    return {
      realmId: data.realm_id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: newExpiresAt,
      connectionId: data.id,
    }
  }

  return {
    realmId: data.realm_id,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiresAt: data.token_expires_at,
    connectionId: data.id,
  }
}

export async function syncAccounts(companyId: string) {
  const conn = await getActiveConnection(companyId)
  if (!conn) throw new Error('No active QuickBooks connection')

  const supabase = await createClient()
  const logId = await createSyncLog(supabase, companyId, 'accounts')

  try {
    const result = await getAccounts({ realmId: conn.realmId, accessToken: conn.accessToken })
    const accounts = (result as { QueryResponse: { Account: unknown[] } }).QueryResponse.Account || []

    await completeSyncLog(supabase, logId, 'success', accounts.length)
    return accounts
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    await completeSyncLog(supabase, logId, 'error', 0, msg)
    throw error
  }
}

export async function syncCustomers(companyId: string) {
  const conn = await getActiveConnection(companyId)
  if (!conn) throw new Error('No active QuickBooks connection')

  const supabase = await createClient()
  const logId = await createSyncLog(supabase, companyId, 'customers')

  try {
    const result = await getCustomers({ realmId: conn.realmId, accessToken: conn.accessToken })
    const customers = (result as { QueryResponse: { Customer: unknown[] } }).QueryResponse.Customer || []

    await completeSyncLog(supabase, logId, 'success', customers.length)
    return customers
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    await completeSyncLog(supabase, logId, 'error', 0, msg)
    throw error
  }
}

export async function syncVendors(companyId: string) {
  const conn = await getActiveConnection(companyId)
  if (!conn) throw new Error('No active QuickBooks connection')

  const supabase = await createClient()
  const logId = await createSyncLog(supabase, companyId, 'vendors')

  try {
    const result = await getVendors({ realmId: conn.realmId, accessToken: conn.accessToken })
    const vendors = (result as { QueryResponse: { Vendor: unknown[] } }).QueryResponse.Vendor || []

    await completeSyncLog(supabase, logId, 'success', vendors.length)
    return vendors
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    await completeSyncLog(supabase, logId, 'error', 0, msg)
    throw error
  }
}

export async function syncAll(companyId: string) {
  const results = await Promise.allSettled([
    syncAccounts(companyId),
    syncCustomers(companyId),
    syncVendors(companyId),
  ])
  return results
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createSyncLog(supabase: any, companyId: string, entityType: string) {
  const { data } = await supabase
    .from('sync_logs')
    .insert({
      company_id: companyId,
      entity_type: entityType,
      status: 'running',
      records_synced: 0,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  return data?.id
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function completeSyncLog(supabase: any, logId: string, status: string, count: number, error?: string) {
  await supabase
    .from('sync_logs')
    .update({
      status,
      records_synced: count,
      error_message: error || null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', logId)
}
