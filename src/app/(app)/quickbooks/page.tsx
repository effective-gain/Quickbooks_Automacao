'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useI18n } from '@/lib/i18n/context'
import { Link2, RefreshCw, CheckCircle, Plus, ArrowRight } from 'lucide-react'

const mockAccounts = [
  { id: '1', name: 'Construction Costs', type: 'Expense', qb_id: '82', mapped: true },
  { id: '2', name: 'Subcontractor Payments', type: 'Expense', qb_id: '84', mapped: true },
  { id: '3', name: 'Materials', type: 'Expense', qb_id: '86', mapped: true },
  { id: '4', name: 'Equipment Rental', type: 'Expense', qb_id: null, mapped: false },
  { id: '5', name: 'Revenue - Construction', type: 'Income', qb_id: '40', mapped: true },
]

const mockRules = [
  { id: '1', name: 'Electric Subs', condition: 'Vendor contains "Electric"', action: 'Assign to Electrical category', active: true },
  { id: '2', name: 'Material Purchases', condition: 'Amount < $5,000 AND Vendor is Home Depot', action: 'Assign to Materials', active: true },
  { id: '3', name: 'Large Payments Alert', condition: 'Amount > $50,000', action: 'Require admin approval + notify WhatsApp', active: true },
  { id: '4', name: 'Insurance Auto-Cat', condition: 'Description contains "insurance"', action: 'Assign to Insurance category', active: false },
]

const mockSyncLogs = [
  { id: '1', entity: 'Accounts', status: 'success', records: 45, time: '2026-03-20 10:30' },
  { id: '2', entity: 'Customers', status: 'success', records: 12, time: '2026-03-20 10:30' },
  { id: '3', entity: 'Vendors', status: 'success', records: 28, time: '2026-03-20 10:30' },
  { id: '4', entity: 'Invoices', status: 'error', records: 0, time: '2026-03-20 10:31', error: 'Rate limit exceeded' },
]

export default function QuickBooksPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('quickbooks.title')}</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>QuickBooks Online API</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" />{t('quickbooks.connected')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Company: <span className="font-medium text-foreground">BuildCo Construction LLC</span></p>
              <p className="text-sm text-muted-foreground">{t('quickbooks.lastSync')}: <span className="font-medium text-foreground">2026-03-20 10:30 AM</span></p>
            </div>
            <Button variant="outline"><RefreshCw className="mr-2 h-4 w-4" />{t('quickbooks.syncNow')}</Button>
            <Button variant="destructive" size="sm">{t('quickbooks.disconnect')}</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">{t('quickbooks.chartOfAccounts')}</TabsTrigger>
          <TabsTrigger value="rules">{t('quickbooks.categorizationRules')}</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>QB Account ID</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAccounts.map((acc) => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-medium">{acc.name}</TableCell>
                      <TableCell>{acc.type}</TableCell>
                      <TableCell>{acc.qb_id || '—'}</TableCell>
                      <TableCell>
                        {acc.mapped ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">Mapped</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Unmapped</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button><Plus className="mr-2 h-4 w-4" />New Rule</Button>
          </div>
          {mockRules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1">
                  <p className="font-medium">{rule.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span>IF {rule.condition}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>THEN {rule.action}</span>
                  </div>
                </div>
                <Badge variant="outline" className={rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}>
                  {rule.active ? 'Active' : 'Inactive'}
                </Badge>
                <Button variant="ghost" size="sm">{t('common.edit')}</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSyncLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.entity}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.records}</TableCell>
                      <TableCell>{log.time}</TableCell>
                      <TableCell className="text-red-500">{log.error || '—'}</TableCell>
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
