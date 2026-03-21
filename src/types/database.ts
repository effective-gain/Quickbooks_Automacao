// ==========================================
// Database Types — Supabase Schema
// ==========================================

export type UserRole = 'admin' | 'contractor' | 'subcontractor' | 'accountant'
export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type DocumentStatus = 'pending' | 'uploaded' | 'approved' | 'rejected' | 'expired'
export type SyncStatus = 'pending' | 'running' | 'success' | 'error'
export type BudgetStatus = 'draft' | 'sent' | 'approved' | 'rejected'
export type TakeoffStatus = 'uploaded' | 'processing' | 'ready' | 'error'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  company_id: string | null
  phone: string | null
  locale: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  ein: string | null
  address: string | null
  phone: string | null
  qb_realm_id: string | null
  created_at: string
}

export interface QBConnection {
  id: string
  company_id: string
  realm_id: string
  access_token: string
  refresh_token: string
  token_expires_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  company_id: string
  name: string
  address: string | null
  status: ProjectStatus
  total_sf: number | null
  budget_total: number
  actual_total: number
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface CostCategory {
  id: string
  company_id: string
  name: string
  qb_account_id: string | null
  parent_id: string | null
  sort_order: number
}

export interface CostEntry {
  id: string
  project_id: string
  category_id: string
  description: string
  amount: number
  vendor_id: string | null
  invoice_id: string | null
  qb_txn_id: string | null
  date: string
  created_at: string
}

export interface Takeoff {
  id: string
  project_id: string
  file_url: string
  file_name: string
  status: TakeoffStatus
  created_by: string
  created_at: string
}

export interface TakeoffItem {
  id: string
  takeoff_id: string
  category_id: string | null
  description: string
  quantity: number
  unit: string
  unit_cost: number | null
  total_cost: number | null
}

export interface Budget {
  id: string
  project_id: string
  version: number
  status: BudgetStatus
  total: number
  created_by: string
  created_at: string
}

export interface BudgetLine {
  id: string
  budget_id: string
  category_id: string
  description: string
  quantity: number
  unit: string
  unit_cost: number
  total: number
}

export interface Subcontractor {
  id: string
  company_id: string
  name: string
  trade: string
  email: string | null
  phone: string | null
  ein: string | null
  is_compliant: boolean
  created_at: string
}

export interface DocumentRequest {
  id: string
  subcontractor_id: string
  document_type: string
  status: DocumentStatus
  file_url: string | null
  expires_at: string | null
  requested_at: string
  uploaded_at: string | null
}

export interface Invoice {
  id: string
  project_id: string
  subcontractor_id: string | null
  invoice_number: string
  status: InvoiceStatus
  amount: number
  due_date: string
  qb_invoice_id: string | null
  created_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  total: number
  category_id: string | null
}

export interface BankAccount {
  id: string
  company_id: string
  name: string
  institution: string
  account_number_last4: string
  balance: number
  qb_account_id: string | null
  updated_at: string
}

export interface BankTransaction {
  id: string
  bank_account_id: string
  date: string
  description: string
  amount: number
  category_id: string | null
  is_reconciled: boolean
  qb_txn_id: string | null
}

export interface AutomationRule {
  id: string
  company_id: string
  name: string
  trigger_type: string
  conditions: Record<string, unknown>
  actions: Record<string, unknown>
  is_active: boolean
  created_at: string
}

export interface SyncLog {
  id: string
  company_id: string
  entity_type: string
  status: SyncStatus
  records_synced: number
  error_message: string | null
  started_at: string
  completed_at: string | null
}
