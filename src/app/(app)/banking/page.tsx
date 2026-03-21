'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useI18n } from '@/lib/i18n/context'
import { Upload, CheckCircle, Circle, Landmark } from 'lucide-react'

const mockAccounts = [
  { id: '1', name: 'Operating Account', institution: 'Chase Bank', last4: '4523', balance: 285400 },
  { id: '2', name: 'Payroll Account', institution: 'Chase Bank', last4: '7891', balance: 142000 },
  { id: '3', name: 'Reserve Account', institution: 'Bank of America', last4: '3456', balance: 520000 },
]

const mockTransactions = [
  { id: '1', date: '2026-03-20', description: 'ABC Electric - Progress Payment', amount: -45000, category: 'Electrical', reconciled: true },
  { id: '2', date: '2026-03-19', description: 'Client Payment - Riverside Apts', amount: 125000, category: 'Revenue', reconciled: true },
  { id: '3', date: '2026-03-18', description: 'Home Depot - Materials', amount: -3420, category: 'Materials', reconciled: false },
  { id: '4', date: '2026-03-18', description: 'XYZ Plumbing - Draw #3', amount: -32000, category: 'Plumbing', reconciled: false },
  { id: '5', date: '2026-03-17', description: 'Steel Masters Inc - Deposit', amount: -64000, category: 'Structural', reconciled: false },
  { id: '6', date: '2026-03-15', description: 'Insurance Premium', amount: -8500, category: 'Insurance', reconciled: true },
  { id: '7', date: '2026-03-14', description: 'Client Payment - Sunset Plaza', amount: 95000, category: 'Revenue', reconciled: true },
]

export default function BankingPage() {
  const { t } = useI18n()
  const totalBalance = mockAccounts.reduce((s, a) => s + a.balance, 0)
  const unreconciled = mockTransactions.filter(t => !t.reconciled).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('banking.title')}</h1>
        <Button><Upload className="mr-2 h-4 w-4" />{t('banking.importStatement')}</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {mockAccounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Landmark className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-sm">{account.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{account.institution} ****{account.last4}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${account.balance.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('banking.transactions')}</CardTitle>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">{unreconciled} unreconciled</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('common.description')}</TableHead>
                <TableHead>{t('common.category')}</TableHead>
                <TableHead className="text-right">{t('common.amount')}</TableHead>
                <TableHead>{t('banking.reconciled')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>{txn.date}</TableCell>
                  <TableCell className="font-medium">{txn.description}</TableCell>
                  <TableCell><Badge variant="outline">{txn.category}</Badge></TableCell>
                  <TableCell className={`text-right font-medium ${txn.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {txn.amount >= 0 ? '+' : ''}{txn.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {txn.reconciled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    {!txn.reconciled && <Button variant="ghost" size="sm">{t('banking.reconcile')}</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
