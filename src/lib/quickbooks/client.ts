const QB_BASE_URL = 'https://quickbooks.api.intuit.com/v3'
const QB_SANDBOX_URL = 'https://sandbox-quickbooks.api.intuit.com/v3'

const isProduction = process.env.NODE_ENV === 'production'
const baseUrl = isProduction ? QB_BASE_URL : QB_SANDBOX_URL

interface QBRequestOptions {
  method?: string
  body?: unknown
  realmId: string
  accessToken: string
}

export async function qbRequest<T>(endpoint: string, options: QBRequestOptions): Promise<T> {
  const { method = 'GET', body, realmId, accessToken } = options

  const url = `${baseUrl}/company/${realmId}${endpoint}`

  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`QuickBooks API error ${res.status}: ${error}`)
  }

  return res.json()
}

// Chart of Accounts
export function getAccounts(options: Omit<QBRequestOptions, 'method'>) {
  return qbRequest('/query?query=SELECT * FROM Account MAXRESULTS 1000', options)
}

// Customers
export function getCustomers(options: Omit<QBRequestOptions, 'method'>) {
  return qbRequest('/query?query=SELECT * FROM Customer MAXRESULTS 1000', options)
}

// Vendors
export function getVendors(options: Omit<QBRequestOptions, 'method'>) {
  return qbRequest('/query?query=SELECT * FROM Vendor MAXRESULTS 1000', options)
}

// Invoices
export function createInvoice(invoice: unknown, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/invoice', { ...options, method: 'POST', body: invoice })
}

// Bills
export function createBill(bill: unknown, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/bill', { ...options, method: 'POST', body: bill })
}

// Purchase (expense entry)
export function createPurchase(purchase: unknown, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/purchase', { ...options, method: 'POST', body: purchase })
}

// Journal Entry (for cost center allocation)
export function createJournalEntry(entry: unknown, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/journalentry', { ...options, method: 'POST', body: entry })
}

// Query any entity
export function queryQB(query: string, options: Omit<QBRequestOptions, 'method'>) {
  return qbRequest(`/query?query=${encodeURIComponent(query)}`, options)
}
