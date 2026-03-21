'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useI18n } from '@/lib/i18n/context'
import { Plus, Search, Send, CheckCircle } from 'lucide-react'
import type { InvoiceStatus } from '@/types/database'

const statusStyles: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

const mockInvoices = [
  { id: '1', invoice_number: 'INV-001', project: 'Riverside Apartments', sub: 'ABC Electric', amount: 45000, status: 'paid' as InvoiceStatus, due_date: '2026-02-15', qb_synced: true },
  { id: '2', invoice_number: 'INV-002', project: 'Riverside Apartments', sub: 'XYZ Plumbing', amount: 32000, status: 'sent' as InvoiceStatus, due_date: '2026-03-20', qb_synced: true },
  { id: '3', invoice_number: 'INV-003', project: 'Downtown Office Tower', sub: 'Steel Masters Inc', amount: 128000, status: 'overdue' as InvoiceStatus, due_date: '2026-03-01', qb_synced: false },
  { id: '4', invoice_number: 'INV-004', project: 'Riverside Apartments', sub: 'Cool Air HVAC', amount: 67000, status: 'draft' as InvoiceStatus, due_date: '2026-04-15', qb_synced: false },
  { id: '5', invoice_number: 'INV-005', project: 'Sunset Plaza Retail', sub: 'Foundation Pro LLC', amount: 95000, status: 'sent' as InvoiceStatus, due_date: '2026-03-25', qb_synced: true },
]

export default function InvoicesPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')

  const filtered = mockInvoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    inv.project.toLowerCase().includes(search.toLowerCase()) ||
    inv.sub.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('invoices.title')}</h1>
        <Button><Plus className="mr-2 h-4 w-4" />{t('invoices.newInvoice')}</Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({mockInvoices.length})</TabsTrigger>
          <TabsTrigger value="draft">{t('invoices.draft')} ({mockInvoices.filter(i => i.status === 'draft').length})</TabsTrigger>
          <TabsTrigger value="sent">{t('invoices.sent')} ({mockInvoices.filter(i => i.status === 'sent').length})</TabsTrigger>
          <TabsTrigger value="overdue">{t('invoices.overdue')} ({mockInvoices.filter(i => i.status === 'overdue').length})</TabsTrigger>
          <TabsTrigger value="paid">{t('invoices.paid')} ({mockInvoices.filter(i => i.status === 'paid').length})</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('invoices.invoiceNumber')}</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Subcontractor</TableHead>
                    <TableHead className="text-right">{t('common.amount')}</TableHead>
                    <TableHead>{t('invoices.dueDate')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>QB</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.project}</TableCell>
                      <TableCell>{inv.sub}</TableCell>
                      <TableCell className="text-right">${inv.amount.toLocaleString()}</TableCell>
                      <TableCell>{inv.due_date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyles[inv.status]}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {inv.qb_synced ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Button variant="ghost" size="sm"><Send className="h-3 w-3" /></Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">{t('common.edit')}</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
