'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useI18n } from '@/lib/i18n/context'
import { Plus, Send, CheckCircle, Clock, XCircle } from 'lucide-react'
import type { BudgetStatus } from '@/types/database'

const statusStyles: Record<BudgetStatus, { color: string; icon: typeof CheckCircle }> = {
  draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
  sent: { color: 'bg-blue-100 text-blue-800', icon: Send },
  approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
}

const mockBudgets = [
  { id: '1', project: 'Riverside Apartments', version: 3, status: 'approved' as BudgetStatus, total: 2400000, created: '2025-12-15', lines: 24 },
  { id: '2', project: 'Downtown Office Tower', version: 1, status: 'draft' as BudgetStatus, total: 8500000, created: '2026-02-20', lines: 42 },
  { id: '3', project: 'Sunset Plaza Retail', version: 2, status: 'approved' as BudgetStatus, total: 1200000, created: '2025-11-01', lines: 18 },
  { id: '4', project: 'Harbor View Condos', version: 1, status: 'sent' as BudgetStatus, total: 4200000, created: '2026-01-10', lines: 35 },
]

export default function BudgetsPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('common.budgets')}</h1>
        <Button><Plus className="mr-2 h-4 w-4" />{t('common.create')}</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('common.total')}</TableHead>
                <TableHead>Line Items</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBudgets.map((budget) => {
                const style = statusStyles[budget.status]
                const Icon = style.icon
                return (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">{budget.project}</TableCell>
                    <TableCell>v{budget.version}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={style.color}>
                        <Icon className="mr-1 h-3 w-3" />{budget.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${budget.total.toLocaleString()}</TableCell>
                    <TableCell>{budget.lines} items</TableCell>
                    <TableCell>{budget.created}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">{t('common.edit')}</Button>
                        {budget.status === 'draft' && (
                          <Button variant="ghost" size="sm"><Send className="mr-1 h-3 w-3" />{t('takeoff.sendToBudget')}</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
