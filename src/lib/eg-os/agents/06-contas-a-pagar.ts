// ==========================================
// AGENT 6: CONTAS A PAGAR
// Layer 2 — EXECUÇÃO
// Processes received invoices from subcontractors
// Sub-agents: 6.1 Invoice Reader (Vision), 6.2 Bill Registrar, 6.3 1099 Tracker
// Complexity: VERY HIGH — photo parsing + compliance
// ==========================================

import type { ClassifierOutput, ExtractedData } from './types'
import { createClient } from '@/lib/supabase/server'
import { createBill, createVendor, queryQB, type QBBillCreate } from '@/lib/quickbooks/client'
import { getActiveConnection } from '@/lib/quickbooks/sync'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

// ==========================================
// Sub-agent 6.1: Invoice Reader (Claude Vision)
// Extracts data from photos of invoices
// ==========================================

const VISION_SYSTEM_PROMPT = `You are an expert invoice/receipt reader for a construction company. Extract ALL data from this image of an invoice or receipt.

EXTRACT:
- vendor_name: Company/person name on the invoice
- vendor_address: If visible
- invoice_number: Invoice/receipt number
- date: Date on the document (YYYY-MM-DD)
- due_date: If visible (YYYY-MM-DD)
- items: Array of line items [{description, quantity, unit_price, amount}]
- subtotal: Before tax
- tax_amount: Sales tax if shown
- total: Final total
- notes: Any relevant notes

RESPOND IN STRICT JSON:
{
  "vendor_name": "string",
  "vendor_address": "string or null",
  "invoice_number": "string or null",
  "date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "items": [{"description": "string", "quantity": number, "unit_price": number, "amount": number}],
  "subtotal": number,
  "tax_amount": number,
  "total": number,
  "notes": "string or null",
  "confidence": 0.0 to 1.0,
  "issues": ["list any problems reading the image"]
}`

export async function readInvoiceFromImage(imageUrl: string): Promise<ExtractedData & { visionConfidence: number; issues: string[] }> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY required for Vision invoice reading')
  }

  // Download image
  const imageRes = await fetch(imageUrl)
  if (!imageRes.ok) throw new Error(`Failed to download image: ${imageRes.status}`)
  const imageBuffer = await imageRes.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))
  const mediaType = imageRes.headers.get('content-type') || 'image/jpeg'

  // Send to Claude Vision
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 2048,
      system: VISION_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          { type: 'text', text: 'Extract all data from this invoice/receipt.' },
        ],
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude Vision error: ${err}`)
  }

  const data = await res.json() as { content: Array<{ text: string }> }
  const responseText = data.content[0]?.text || ''
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse Vision response')

  const parsed = JSON.parse(jsonMatch[0])

  return {
    vendor: parsed.vendor_name,
    amount: parsed.total,
    invoiceNumber: parsed.invoice_number,
    date: parsed.date,
    description: parsed.items?.[0]?.description || `Invoice from ${parsed.vendor_name}`,
    items: parsed.items?.map((i: { description: string; quantity: number; unit_price: number }) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unit_price,
    })),
    visionConfidence: parsed.confidence || 0.5,
    issues: parsed.issues || [],
  }
}

// ==========================================
// Sub-agent 6.2: Bill Registrar
// Creates bill in QuickBooks
// ==========================================

export async function registerBill(
  extracted: ExtractedData,
  companyId: string,
  projectId?: string
): Promise<{ billId: string; qbBillId?: string }> {
  const supabase = await createClient()

  // Find or create vendor in QB
  const conn = await getActiveConnection(companyId)

  let qbBillId: string | undefined

  if (conn) {
    // Check if vendor exists in QB
    const vendorName = extracted.vendor || 'Unknown Vendor'
    const vendorQuery = await queryQB(
      `SELECT * FROM Vendor WHERE DisplayName = '${vendorName.replace(/'/g, "\\'")}'`,
      { realmId: conn.realmId, accessToken: conn.accessToken }
    ) as { QueryResponse: { Vendor?: Array<{ Id: string }> } }

    let vendorRef: string
    if (vendorQuery.QueryResponse.Vendor?.length) {
      vendorRef = vendorQuery.QueryResponse.Vendor[0].Id
    } else {
      // Create vendor
      const newVendor = await createVendor(
        { DisplayName: vendorName },
        { realmId: conn.realmId, accessToken: conn.accessToken }
      ) as { Vendor: { Id: string } }
      vendorRef = newVendor.Vendor.Id
    }

    // Create bill in QB
    const billPayload: QBBillCreate = {
      VendorRef: { value: vendorRef },
      Line: (extracted.items || [{ description: extracted.description, quantity: 1, unitPrice: extracted.amount || 0 }]).map(item => ({
        Amount: item.quantity * item.unitPrice,
        DetailType: 'AccountBasedExpenseLineDetail' as const,
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: '1' }, // will be mapped by category
        },
        Description: item.description,
      })),
      TxnDate: extracted.date || new Date().toISOString().split('T')[0],
      DocNumber: extracted.invoiceNumber || undefined,
    }

    try {
      const qbResult = await createBill(billPayload, {
        realmId: conn.realmId,
        accessToken: conn.accessToken,
      }) as { Bill: { Id: string } }
      qbBillId = qbResult.Bill.Id
    } catch (error) {
      console.error('[Contas a Pagar] QB bill creation failed:', error)
    }
  }

  // Save to local DB
  const { data: invoice } = await supabase.from('invoices').insert({
    project_id: projectId || null,
    invoice_number: extracted.invoiceNumber || `BILL-${Date.now()}`,
    amount: extracted.amount || 0,
    due_date: extracted.date || new Date().toISOString().split('T')[0],
    status: 'draft',
    qb_invoice_id: qbBillId,
  }).select('id').single()

  return {
    billId: invoice?.id || '',
    qbBillId,
  }
}

// ==========================================
// Sub-agent 6.3: 1099 Tracker
// Tracks accumulated payments per vendor
// ==========================================

export async function check1099Status(companyId: string, vendorName: string): Promise<{
  totalPaid: number
  requires1099: boolean
  hasW9: boolean
  warning?: string
}> {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()

  // Get total paid to this vendor this year
  const { data: entries } = await supabase
    .from('cost_entries')
    .select('amount')
    .gte('date', `${currentYear}-01-01`)
    .ilike('description', `%${vendorName}%`)

  const totalPaid = entries?.reduce((s, e) => s + Number(e.amount), 0) || 0

  // Check if vendor has W-9 on file
  const { data: sub } = await supabase
    .from('subcontractors')
    .select('id, is_compliant')
    .ilike('name', `%${vendorName}%`)
    .single()

  let hasW9 = false
  if (sub) {
    const { data: docs } = await supabase
      .from('document_requests')
      .select('status')
      .eq('subcontractor_id', sub.id)
      .eq('document_type', 'W-9 Form')
      .eq('status', 'approved')

    hasW9 = (docs?.length || 0) > 0
  }

  const requires1099 = totalPaid >= 600
  let warning: string | undefined

  if (requires1099 && !hasW9) {
    warning = `⚠️ CRITICAL: $${totalPaid.toLocaleString()} paid to "${vendorName}" this year. 1099 required but NO W-9 on file. Backup withholding of 24% may apply.`
  }

  return { totalPaid, requires1099, hasW9, warning }
}
