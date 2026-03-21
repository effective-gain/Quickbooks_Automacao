'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useI18n } from '@/lib/i18n/context'
import { Download, FileSpreadsheet } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts'

const plData = [
  { month: 'Jan', revenue: 245000, expenses: 198000, profit: 47000 },
  { month: 'Feb', revenue: 312000, expenses: 265000, profit: 47000 },
  { month: 'Mar', revenue: 198000, expenses: 215000, profit: -17000 },
  { month: 'Apr', revenue: 425000, expenses: 320000, profit: 105000 },
  { month: 'May', revenue: 380000, expenses: 295000, profit: 85000 },
  { month: 'Jun', revenue: 290000, expenses: 245000, profit: 45000 },
]

const cashFlowData = [
  { month: 'Jan', inflow: 245000, outflow: 198000, balance: 520000 },
  { month: 'Feb', inflow: 312000, outflow: 265000, balance: 567000 },
  { month: 'Mar', inflow: 198000, outflow: 215000, balance: 550000 },
  { month: 'Apr', inflow: 425000, outflow: 320000, balance: 655000 },
  { month: 'May', inflow: 380000, outflow: 295000, balance: 740000 },
  { month: 'Jun', inflow: 290000, outflow: 245000, balance: 785000 },
]

const sfData = [
  { project: 'Riverside Apartments', sf: 45000, totalCost: 1800000, costPerSF: 40.00 },
  { project: 'Downtown Office Tower', sf: 120000, totalCost: 350000, costPerSF: 2.92 },
  { project: 'Sunset Plaza Retail', sf: 28000, totalCost: 920000, costPerSF: 32.86 },
  { project: 'Harbor View Condos', sf: 65000, totalCost: 1100000, costPerSF: 16.92 },
]

export default function ReportsPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="mr-2 h-4 w-4" />{t('reports.exportPDF')}</Button>
          <Button variant="outline"><FileSpreadsheet className="mr-2 h-4 w-4" />{t('reports.exportExcel')}</Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Project" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="1">Riverside Apartments</SelectItem>
            <SelectItem value="2">Downtown Office Tower</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="2026">
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2026">2026</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="pl">
        <TabsList>
          <TabsTrigger value="pl">{t('reports.profitLoss')}</TabsTrigger>
          <TabsTrigger value="cashflow">{t('reports.cashFlow')}</TabsTrigger>
          <TabsTrigger value="sf">{t('reports.bySF')}</TabsTrigger>
        </TabsList>

        <TabsContent value="pl" className="mt-4">
          <Card>
            <CardHeader><CardTitle>{t('reports.profitLoss')}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={plData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="hsl(var(--chart-1))" name="Revenue" />
                    <Bar dataKey="expenses" fill="hsl(var(--chart-2))" name="Expenses" />
                    <Bar dataKey="profit" fill="hsl(var(--chart-3))" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="mt-4">
          <Card>
            <CardHeader><CardTitle>{t('reports.cashFlow')}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                    <Legend />
                    <Area type="monotone" dataKey="balance" fill="hsl(var(--chart-1))" stroke="hsl(var(--chart-1))" fillOpacity={0.2} name="Balance" />
                    <Line type="monotone" dataKey="inflow" stroke="hsl(var(--chart-3))" name="Inflow" />
                    <Line type="monotone" dataKey="outflow" stroke="hsl(var(--chart-2))" name="Outflow" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sf" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Cost per Square Foot by Project</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Total SF</TableHead>
                    <TableHead className="text-right">{t('common.total')} Cost</TableHead>
                    <TableHead className="text-right">$/SF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sfData.map((row) => (
                    <TableRow key={row.project}>
                      <TableCell className="font-medium">{row.project}</TableCell>
                      <TableCell className="text-right">{row.sf.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${row.totalCost.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold">${row.costPerSF.toFixed(2)}</TableCell>
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
