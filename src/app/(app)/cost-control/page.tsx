'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/lib/i18n/context'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

const costByCategory = [
  { category: 'Foundation', budget: 185000, actual: 178000, sf_cost: 3.96 },
  { category: 'Framing', budget: 320000, actual: 295000, sf_cost: 6.56 },
  { category: 'Electrical', budget: 245000, actual: 260000, sf_cost: 5.78 },
  { category: 'Plumbing', budget: 198000, actual: 185000, sf_cost: 4.11 },
  { category: 'HVAC', budget: 210000, actual: 195000, sf_cost: 4.33 },
  { category: 'Finishes', budget: 420000, actual: 380000, sf_cost: 8.44 },
  { category: 'Roofing', budget: 175000, actual: 168000, sf_cost: 3.73 },
  { category: 'Site Work', budget: 95000, actual: 88000, sf_cost: 1.96 },
]

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#0891b2', '#ea580c', '#64748b']

const pieData = costByCategory.map((c, i) => ({
  name: c.category,
  value: c.actual,
  fill: COLORS[i],
}))

export default function CostControlPage() {
  const { t } = useI18n()
  const totalBudget = costByCategory.reduce((s, c) => s + c.budget, 0)
  const totalActual = costByCategory.reduce((s, c) => s + c.actual, 0)
  const totalSF = 45000

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('common.costControl')}</h1>
        <Select defaultValue="1">
          <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select project" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Riverside Apartments</SelectItem>
            <SelectItem value="2">Downtown Office Tower</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t('projects.budget')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t('projects.spent')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${totalActual.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{t('projects.remaining')}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">${(totalBudget - totalActual).toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg $/SF</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${(totalActual / totalSF).toFixed(2)}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('dashboard.budgetVsActual')}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="budget" fill="hsl(var(--chart-1))" name="Budget" />
                  <Bar dataKey="actual" fill="hsl(var(--chart-2))" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('reports.costBreakdown')}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('reports.bySF')} — Cost per Category</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.category')}</TableHead>
                <TableHead className="text-right">{t('projects.budget')}</TableHead>
                <TableHead className="text-right">{t('projects.spent')}</TableHead>
                <TableHead className="text-right">$/SF</TableHead>
                <TableHead>{t('projects.progress')}</TableHead>
                <TableHead className="text-right">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costByCategory.map((row) => {
                const pct = Math.round((row.actual / row.budget) * 100)
                const variance = row.budget - row.actual
                return (
                  <TableRow key={row.category}>
                    <TableCell className="font-medium">{row.category}</TableCell>
                    <TableCell className="text-right">${row.budget.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${row.actual.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${row.sf_cost.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className={`w-20 ${pct > 100 ? '[&>div]:bg-red-500' : ''}`} />
                        <span className={`text-sm ${pct > 100 ? 'text-red-500' : 'text-muted-foreground'}`}>{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right ${variance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {variance >= 0 ? '+' : ''}{variance.toLocaleString()}
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
