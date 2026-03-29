// ==========================================
// AGENT 8: FISCAL
// Layer 3 — INTELIGÊNCIA
// Massachusetts tax rules for every transaction
// Sub-agents: 8.1 Sales Tax, 8.2 Estimated Tax, 8.3 1099 Generator, 8.4 Deadline Monitor
// Complexity: HIGH — Risk: VERY HIGH (triple damages in MA)
// ==========================================

import type { ClassifierOutput, FiscalValidation } from './types'
import { createClient } from '@/lib/supabase/server'

// Massachusetts tax constants
const MA_SALES_TAX_RATE = 0.0625 // 6.25%
const THRESHOLD_1099 = 600        // IRS threshold for 1099-NEC
const FEDERAL_SELF_EMPLOYMENT_RATE = 0.153 // 15.3% SE tax
const MA_INCOME_TAX_RATE = 0.05   // 5% flat

// Categories that are TAXABLE (materials)
const TAXABLE_CATEGORIES = [
  'Materials', 'Concrete/Foundation', 'Metals/Steel', 'Doors/Windows',
  'Specialties', 'Equipment',
]

// Categories that are EXEMPT (labor/services)
const EXEMPT_CATEGORIES = [
  'Labor', 'General Conditions', 'Permits/Fees', 'Insurance',
  'Carpentry/Framing', 'Plumbing', 'Electrical', 'Mechanical',
  'Finishes', 'Site Work', 'Thermal/Moisture',
]

export async function validateTransaction(
  classified: ClassifierOutput,
  companyId: string
): Promise<FiscalValidation> {
  const warnings: string[] = []
  const category = classified.extractedData.category || ''
  const amount = classified.extractedData.amount || 0
  const vendor = classified.extractedData.vendor || ''

  // Sub-agent 8.1: Sales Tax
  const isTaxExempt = isLaborOrService(category)
  const salesTaxApplied = !isTaxExempt && isTaxableMaterial(category)
  const salesTaxAmount = salesTaxApplied ? Math.round(amount * MA_SALES_TAX_RATE * 100) / 100 : 0
  let exemptReason: string | undefined

  if (isTaxExempt) {
    exemptReason = `Labor/services exempt from MA sales tax (M.G.L. c.64H)`
  }

  // Mixed transactions warning
  if (!isTaxExempt && !salesTaxApplied && amount > 0) {
    warnings.push(
      `Category "${category}" not clearly classified as taxable or exempt. ` +
      `Review: MA charges 6.25% on materials but NOT on labor/services.`
    )
  }

  // Sub-agent 8.3: 1099 Tracking
  const vendorTotal = await getVendorYTDPayments(companyId, vendor)
  const newTotal = vendorTotal + amount
  const requires1099 = newTotal >= THRESHOLD_1099

  if (newTotal >= THRESHOLD_1099 && vendorTotal < THRESHOLD_1099) {
    warnings.push(
      `⚠️ 1099 THRESHOLD: Payments to "${vendor}" now total $${newTotal.toLocaleString()}. ` +
      `This vendor requires a 1099-NEC. Ensure W-9 is on file.`
    )
  }

  if (newTotal >= 50000) {
    warnings.push(
      `⚠️ HIGH VENDOR SPEND: $${newTotal.toLocaleString()} paid to "${vendor}" this year. Review for cost optimization.`
    )
  }

  // Sub-agent 8.4: Deadline warnings
  const deadlineWarnings = checkUpcomingDeadlines()
  warnings.push(...deadlineWarnings)

  // Validate: don't let transactions through without vendor for amounts > $600
  if (amount >= 600 && !vendor && classified.intent === 'DESPESA') {
    warnings.push(
      `⚠️ COMPLIANCE: Expense >= $600 without vendor name. Vendor is required for 1099 tracking.`
    )
  }

  return {
    isValid: warnings.filter(w => w.startsWith('⚠️')).length === 0 || classified.intent === 'CONSULTA',
    salesTaxApplied,
    salesTaxAmount,
    salesTaxRate: salesTaxApplied ? MA_SALES_TAX_RATE : 0,
    isTaxExempt,
    exemptReason,
    requires1099,
    vendorTotal1099: newTotal,
    threshold1099: THRESHOLD_1099,
    warnings,
  }
}

function isLaborOrService(category: string): boolean {
  return EXEMPT_CATEGORIES.some(c => category.toLowerCase().includes(c.toLowerCase()))
}

function isTaxableMaterial(category: string): boolean {
  return TAXABLE_CATEGORIES.some(c => category.toLowerCase().includes(c.toLowerCase()))
}

async function getVendorYTDPayments(companyId: string, vendorName: string): Promise<number> {
  if (!vendorName) return 0

  const supabase = await createClient()
  const currentYear = new Date().getFullYear()
  const startOfYear = `${currentYear}-01-01`

  const { data } = await supabase
    .from('cost_entries')
    .select('amount')
    .gte('date', startOfYear)
    .ilike('description', `%${vendorName}%`)

  if (!data) return 0
  return data.reduce((sum, entry) => sum + Number(entry.amount), 0)
}

function checkUpcomingDeadlines(): string[] {
  const warnings: string[] = []
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()

  // Quarterly estimated tax deadlines
  const deadlines = [
    { month: 1, day: 15, label: 'Q4 Estimated Tax (federal + MA)' },
    { month: 1, day: 31, label: '1099-NEC filing deadline' },
    { month: 4, day: 15, label: 'Q1 Estimated Tax + Annual Return' },
    { month: 6, day: 15, label: 'Q2 Estimated Tax' },
    { month: 9, day: 15, label: 'Q3 Estimated Tax' },
  ]

  for (const d of deadlines) {
    const daysUntil = daysUntilDate(now, d.month, d.day)
    if (daysUntil > 0 && daysUntil <= 14) {
      warnings.push(`📅 DEADLINE in ${daysUntil} days: ${d.label}`)
    }
  }

  return warnings
}

function daysUntilDate(now: Date, month: number, day: number): number {
  const year = now.getFullYear()
  let target = new Date(year, month - 1, day)
  if (target < now) target = new Date(year + 1, month - 1, day)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// Sub-agent 8.2: Calculate quarterly estimated tax
export function calculateEstimatedTax(annualIncome: number): {
  federal: number; state: number; total: number; quarterly: number
} {
  // Simplified — real calculation would use tax brackets
  const selfEmploymentTax = annualIncome * FEDERAL_SELF_EMPLOYMENT_RATE
  const adjustedIncome = annualIncome - (selfEmploymentTax / 2)

  // Federal (simplified: 22% bracket for most contractors)
  const federalIncomeTax = adjustedIncome * 0.22
  const federal = federalIncomeTax + selfEmploymentTax

  // Massachusetts flat 5%
  const state = annualIncome * MA_INCOME_TAX_RATE

  const total = federal + state
  return {
    federal: Math.round(federal),
    state: Math.round(state),
    total: Math.round(total),
    quarterly: Math.round(total / 4),
  }
}
