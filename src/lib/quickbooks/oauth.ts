// ==========================================
// QuickBooks OAuth 2.0
// Uses Intuit Discovery Document for endpoints
// https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
// ==========================================

// Intuit OAuth Discovery Document — single source of truth for endpoints
// https://developer.api.intuit.com/.well-known/openid_configuration
const QB_DISCOVERY_URL = 'https://developer.api.intuit.com/.well-known/openid_configuration'

// Fallback endpoints (in case discovery doc is unreachable)
const FALLBACK_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2'
const FALLBACK_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
const FALLBACK_REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke'
const FALLBACK_USERINFO_URL = 'https://accounts.platform.intuit.com/v1/openid_connect/userinfo'

const clientId = process.env.QB_CLIENT_ID!
const clientSecret = process.env.QB_CLIENT_SECRET!
const redirectUri = process.env.QB_REDIRECT_URI!

// Cache discovery document
let discoveryCache: DiscoveryDocument | null = null
let discoveryCacheTime = 0
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

interface DiscoveryDocument {
  authorization_endpoint: string
  token_endpoint: string
  revocation_endpoint: string
  userinfo_endpoint: string
  issuer: string
}

async function getDiscoveryDocument(): Promise<DiscoveryDocument> {
  if (discoveryCache && Date.now() - discoveryCacheTime < CACHE_TTL) {
    return discoveryCache
  }

  try {
    const res = await fetch(QB_DISCOVERY_URL, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      discoveryCache = await res.json()
      discoveryCacheTime = Date.now()
      return discoveryCache!
    }
  } catch (e) {
    console.warn('[QB OAuth] Discovery document fetch failed, using fallbacks')
  }

  return {
    authorization_endpoint: FALLBACK_AUTH_URL,
    token_endpoint: FALLBACK_TOKEN_URL,
    revocation_endpoint: FALLBACK_REVOKE_URL,
    userinfo_endpoint: FALLBACK_USERINFO_URL,
    issuer: 'https://oauth.platform.intuit.com/op/v1',
  }
}

export async function getAuthorizationUrl(state: string) {
  const discovery = await getDiscoveryDocument()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    state,
  })
  return `${discovery.authorization_endpoint}?${params.toString()}`
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  x_refresh_token_expires_in: number
  token_type: string
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const discovery = await getDiscoveryDocument()
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error(`[QB OAuth] Token exchange failed: ${error}`)
    throw new Error(`Token exchange failed: ${error}`)
  }

  return res.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const discovery = await getDiscoveryDocument()
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error(`[QB OAuth] Token refresh failed: ${error}`)
    throw new Error(`Token refresh failed: ${error}`)
  }

  return res.json()
}

export async function revokeToken(token: string): Promise<void> {
  const discovery = await getDiscoveryDocument()
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(discovery.revocation_endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ token }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error(`[QB OAuth] Token revocation failed: ${error}`)
  }
}
