'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/context'
import { FolderKanban, DollarSign, FileText, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const chartData = [
  { category: 'Foundation', budget: 45000, actual: 42000 },
  { category: 'Framing', budget: 85000, actual: 78000 },
  { category: 'Electrical', budget: 32000, actual: 35000 },
  { category: 'Plumbing', budget: 28000, actual: 26000 },
  { category: 'HVAC', budget: 22000, actual: 24000 },
  { category: 'Finishes', budget: 55000, actual: 48000 },
]

const stats = [
  { key: 'dashboard.totalProjects', value: '12', icon: FolderKanban, trend: '+2' },
  { key: 'dashboard.totalBudget', value: '$2.4M', icon: DollarSign, trend: '' },
  { key: 'dashboard.totalSpent', value: '$1.8M', icon: TrendingUp, trend: '75%' },
  { key: 'dashboard.pendingInvoices', value: '8', icon: FileText, trend: '$124K' },
]

export default function DashboardPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('common.dashboard')}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t(stat.key)}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.trend && <p className="text-xs text-muted-foreground">{stat.trend}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.budgetVsActual')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="budget" fill="hsl(var(--chart-1))" name="Budget" />
                <Bar dataKey="actual" fill="hsl(var(--chart-2))" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
