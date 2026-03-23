// ==========================================
// QuickBooks Online API Client — Full CRUD
// Entities: Account, Customer, Vendor, Invoice,
// Bill, Purchase, Estimate, Item, Payment,
// JournalEntry, Class, Department
// ==========================================

const QB_BASE_URL = 'https://quickbooks.api.intuit.com/v3'
const QB_SANDBOX_URL = 'https://sandbox-quickbooks.api.intuit.com/v3'
const QB_MINOR_VERSION = '75' // always pin minor version

const isProduction = process.env.QB_ENVIRONMENT === 'production'
const baseUrl = isProduction ? QB_BASE_URL : QB_SANDBOX_URL

interface QBRequestOptions {
  method?: string
  body?: unknown
  realmId: string
  accessToken: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QBQueryResponse<T = any> = { QueryResponse: any }

export async function qbRequest<T>(endpoint: string, options: QBRequestOptions): Promise<T> {
  const { method = 'GET', body, realmId, accessToken } = options

  const separator = endpoint.includes('?') ? '&' : '?'
  const url = `${baseUrl}/company/${realmId}${endpoint}${separator}minorversion=${QB_MINOR_VERSION}`

  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 429) {
    // Rate limited — throw specific error for retry logic
    throw new QBRateLimitError('QuickBooks API rate limit exceeded')
  }

  if (!res.ok) {
    const error = await res.text()
    throw new QBAPIError(`QuickBooks API error ${res.status}: ${error}`, res.status)
  }

  return res.json()
}

// ==========================================
// Error classes
// ==========================================

export class QBAPIError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = 'QBAPIError'
  }
}

export class QBRateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QBRateLimitError'
  }
}

// ==========================================
// Query helper
// ==========================================

export function queryQB<T>(query: string, options: Omit<QBRequestOptions, 'method'>) {
  return qbRequest<QBQueryResponse<T>>(`/query?query=${encodeURIComponent(query)}`, options)
}

// ==========================================
// ACCOUNT
// ==========================================

export function getAccounts(options: Omit<QBRequestOptions, 'method'>) {
  return queryQB('/query?query=SELECT * FROM Account MAXRESULTS 1000', options)
}

export function getAccount(id: string, options: Omit<QBRequestOptions, 'method'>) {
  return qbRequest(`/account/${id}`, options)
}

export function createAccount(account: QBAccountCreate, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/account', { ...options, method: 'POST', body: account })
}

export interface QBAccountCreate {
  Name: string
  AccountType: 'Expense' | 'Income' | 'Bank' | 'Other Current Asset' | 'Fixed Asset' | 'Other Current Liability' | 'Long Term Liability' | 'Equity' | 'Other Expense' | 'Other Income' | 'Cost of Goods Sold' | 'Accounts Receivable' | 'Accounts Payable'
  AccountSubType?: string
  Description?: string
  Classification?: string
}

// ==========================================
// CUSTOMER
// ==========================================

export function getCustomers(options: Omit<QBRequestOptions, 'method'>) {
  return queryQB('/query?query=SELECT * FROM Customer MAXRESULTS 1000', options)
}

export function getCustomer(id: string, options: Omit<QBRequestOptions, 'method'>) {
  return qbRequest(`/customer/${id}`, options)
}

export function createCustomer(customer: QBCustomerCreate, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/customer', { ...options, method: 'POST', body: customer })
}

export function updateCustomer(customer: QBEntityUpdate, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/customer', { ...options, method: 'POST', body: customer })
}

export interface QBCustomerCreate {
  DisplayName: string
  CompanyName?: string
  PrimaryEmailAddr?: { Address: string }
  PrimaryPhone?: { FreeFormNumber: string }
  BillAddr?: QBAddress
  Notes?: string
}

// ==========================================
// VENDOR
// ==========================================

export function getVendors(options: Omit<QBRequestOptions, 'method'>) {
  return queryQB('/query?query=SELECT * FROM Vendor MAXRESULTS 1000', options)
}

export function getVendor(id: string, options: Omit<QBRequestOptions, 'method'>) {
  return qbRequest(`/vendor/${id}`, options)
}

export function createVendor(vendor: QBVendorCreate, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/vendor', { ...options, method: 'POST', body: vendor })
}

export function updateVendor(vendor: QBEntityUpdate, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/vendor', { ...options, method: 'POST', body: vendor })
}

export interface QBVendorCreate {
  DisplayName: string
  CompanyName?: string
  PrimaryEmailAddr?: { Address: string }
  PrimaryPhone?: { FreeFormNumber: string }
  TaxIdentifier?: string // EIN
  BillAddr?: QBAddress
  Notes?: string
}

// ==========================================
// INVOICE
// ==========================================

export function getInvoices(options: Omit<QBRequestOptions, 'method'>) {
  return queryQB('/query?query=SELECT * FROM Invoice MAXRESULTS 1000', options)
}

export function getInvoice(id: string, options: Omit<QBRequestOptions, 'method'>) {
  return qbRequest(`/invoice/${id}`, options)
}

export function createInvoice(invoice: QBInvoiceCreate, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/invoice', { ...options, method: 'POST', body: invoice })
}

export function updateInvoice(invoice: QBEntityUpdate, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/invoice', { ...options, method: 'POST', body: invoice })
}

export function deleteInvoice(id: string, syncToken: string, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest(`/invoice?operation=delete`, { ...options, method: 'POST', body: { Id: id, SyncToken: syncToken } })
}

export function sendInvoiceEmail(id: string, email: string, options: Omit<QBRequestOptions, 'method'>) {
  return qbRequest(`/invoice/${id}/send?sendTo=${encodeURIComponent(email)}`, { ...options, method: 'POST' })
}

export interface QBInvoiceCreate {
  CustomerRef: QBRef
  Line: QBInvoiceLine[]
  DueDate?: string
  TxnDate?: string
  DocNumber?: string
  BillEmail?: { Address: string }
  ClassRef?: QBRef
  DepartmentRef?: QBRef
  PrivateNote?: string
  CustomerMemo?: { value: string }
}

export interface QBInvoiceLine {
  Amount: number
  DetailType: 'SalesItemLineDetail' | 'DescriptionOnly' | 'SubTotalLineDetail'
  Description?: string
  SalesItemLineDetail?: {
    ItemRef: QBRef
    Qty?: number
    UnitPrice?: number
    ClassRef?: QBRef
  }
}

// ==========================================
// BILL (Accounts Payable)
// ==========================================

export function getBills(options: Omit<QBRequestOptions, 'method'>) {
  return queryQB('/query?query=SELECT * FROM Bill MAXRESULTS 1000', options)
}

export function getBill(id: string, options: Omit<QBRequestOptions, 'method'>) {
  return qbRequest(`/bill/${id}`, options)
}

export function createBill(bill: QBBillCreate, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/bill', { ...options, method: 'POST', body: bill })
}

export function updateBill(bill: QBEntityUpdate, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/bill', { ...options, method: 'POST', body: bill })
}

export interface QBBillCreate {
  VendorRef: QBRef
  Line: QBBillLine[]
  TxnDate?: string
  DueDate?: string
  DocNumber?: string
  DepartmentRef?: QBRef
  PrivateNote?: string
}

export interface QBBillLine {
  Amount: number
  DetailType: 'AccountBasedExpenseLineDetail' | 'ItemBasedExpenseLineDetail'
  AccountBasedExpenseLineDetail?: {
    AccountRef: QBRef
    ClassRef?: QBRef
    Description?: string
  }
  ItemBasedExpenseLineDetail?: {
    ItemRef: QBRef
    Qty?: number
    UnitPrice?: number
    ClassRef?: QBRef
  }
}

// ==========================================
// PURCHASE (Expense / Check / Credit Card)
// ==========================================

export function getPurchases(options: Omit<QBRequestOptions, 'method'>) {
  return queryQB('/query?query=SELECT * FROM Purchase MAXRESULTS 1000', options)
}

export function createPurchase(purchase: QBPurchaseCreate, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/purchase', { ...options, method: 'POST', body: purchase })
}

export interface QBPurchaseCreate {
  AccountRef: QBRef // bank/credit card account
  PaymentType: 'Cash' | 'Check' | 'CreditCard'
  EntityRef?: QBRef // vendor
  TxnDate?: string
  DocNumber?: string
  DepartmentRef?: QBRef
  Line: QBPurchaseLine[]
  PrivateNote?: string
}

export interface QBPurchaseLine {
  Amount: number
  DetailType: 'AccountBasedExpenseLineDetail' | 'ItemBasedExpenseLineDetail'
  Description?: string
  AccountBasedExpenseLineDetail?: {
    AccountRef: QBRef
    ClassRef?: QBRef
  }
  ItemBasedExpenseLineDetail?: {
    ItemRef: QBRef
    Qty?: number
    UnitPrice?: number
    ClassRef?: QBRef
  }
}

// ==========================================
// ESTIMATE
// ==========================================

export function getEstimates(options: Omit<QBRequestOptions, 'method'>) {
  return queryQB('/query?query=SELECT * FROM Estimate MAXRESULTS 1000', options)
}

export function createEstimate(estimate: QBEstimateCreate, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/estimate', { ...options, method: 'POST', body: estimate })
}

export interface QBEstimateCreate {
  CustomerRef: QBRef
  Line: QBInvoiceLine[]
  TxnDate?: string
  ExpirationDate?: string
  DepartmentRef?: QBRef
  ClassRef?: QBRef
  PrivateNote?: string
}

// ==========================================
// PAYMENT
// ==========================================

export function getPayments(options: Omit<QBRequestOptions, 'method'>) {
  return queryQB('/query?query=SELECT * FROM Payment MAXRESULTS 1000', options)
}

export function createPayment(payment: QBPaymentCreate, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/payment', { ...options, method: 'POST', body: payment })
}

export interface QBPaymentCreate {
  CustomerRef: QBRef
  TotalAmt: number
  TxnDate?: string
  DepositToAccountRef?: QBRef
  Line?: { Amount: number; LinkedTxn: { TxnId: string; TxnType: 'Invoice' }[] }[]
  PrivateNote?: string
}

// ==========================================
// ITEM (Products / Services)
// ==========================================

export function getItems(options: Omit<QBRequestOptions, 'method'>) {
  return queryQB('/query?query=SELECT * FROM Item MAXRESULTS 1000', options)
}

export function createItem(item: QBItemCreate, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/item', { ...options, method: 'POST', body: item })
}

export interface QBItemCreate {
  Name: string
  Type: 'Service' | 'Inventory' | 'NonInventory'
  IncomeAccountRef?: QBRef
  ExpenseAccountRef?: QBRef
  Description?: string
  UnitPrice?: number
  PurchaseCost?: number
}

// ==========================================
// JOURNAL ENTRY
// ==========================================

export function createJournalEntry(entry: QBJournalEntryCreate, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/journalentry', { ...options, method: 'POST', body: entry })
}

export interface QBJournalEntryCreate {
  Line: QBJournalLine[]
  TxnDate?: string
  DocNumber?: string
  PrivateNote?: string
}

export interface QBJournalLine {
  Amount: number
  DetailType: 'JournalEntryLineDetail'
  JournalEntryLineDetail: {
    PostingType: 'Debit' | 'Credit'
    AccountRef: QBRef
    ClassRef?: QBRef
    DepartmentRef?: QBRef
    Description?: string
    Entity?: { EntityRef: QBRef; Type: 'Customer' | 'Vendor' }
  }
}

// ==========================================
// CLASS (Project / Job tracking)
// ==========================================

export function getClasses(options: Omit<QBRequestOptions, 'method'>) {
  return queryQB('/query?query=SELECT * FROM Class MAXRESULTS 1000', options)
}

export function createClass(cls: { Name: string; ParentRef?: QBRef }, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/class', { ...options, method: 'POST', body: cls })
}

// ==========================================
// DEPARTMENT
// ==========================================

export function getDepartments(options: Omit<QBRequestOptions, 'method'>) {
  return queryQB('/query?query=SELECT * FROM Department MAXRESULTS 1000', options)
}

export function createDepartment(dept: { Name: string; ParentRef?: QBRef }, options: Omit<QBRequestOptions, 'method' | 'body'>) {
  return qbRequest('/department', { ...options, method: 'POST', body: dept })
}

// ==========================================
// REPORTS
// ==========================================

export function getProfitAndLoss(options: Omit<QBRequestOptions, 'method'> & { startDate?: string; endDate?: string }) {
  const params = new URLSearchParams()
  if (options.startDate) params.set('start_date', options.startDate)
  if (options.endDate) params.set('end_date', options.endDate)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return qbRequest(`/reports/ProfitAndLoss${qs}`, options)
}

export function getBalanceSheet(options: Omit<QBRequestOptions, 'method'> & { asOfDate?: string }) {
  const qs = options.asOfDate ? `?as_of=${options.asOfDate}` : ''
  return qbRequest(`/reports/BalanceSheet${qs}`, options)
}

export function getTrialBalance(options: Omit<QBRequestOptions, 'method'>) {
  return qbRequest('/reports/TrialBalance', options)
}

// ==========================================
// Shared types
// ==========================================

export interface QBRef {
  value: string
  name?: string
}

export interface QBAddress {
  Line1?: string
  Line2?: string
  City?: string
  CountrySubDivisionCode?: string // state
  PostalCode?: string
  Country?: string
}

export interface QBEntityUpdate {
  Id: string
  SyncToken: string
  [key: string]: unknown
}
