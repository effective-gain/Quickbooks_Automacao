import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.N8N_WEBHOOK_SECRET

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, data } = body

    const supabase = await createClient()

    switch (action) {
      case 'document_uploaded': {
        await supabase
          .from('document_requests')
          .update({ status: 'uploaded', file_url: data.file_url, uploaded_at: new Date().toISOString() })
          .eq('id', data.document_id)
        break
      }
      case 'whatsapp_response': {
        // Log WhatsApp responses
        console.log('WhatsApp response:', data)
        break
      }
      case 'bank_transaction': {
        await supabase.from('bank_transactions').insert({
          bank_account_id: data.account_id,
          date: data.date,
          description: data.description,
          amount: data.amount,
          is_reconciled: false,
        })
        break
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
