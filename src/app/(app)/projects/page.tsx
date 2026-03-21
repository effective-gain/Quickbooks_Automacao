'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useI18n } from '@/lib/i18n/context'
import { Plus, Search } from 'lucide-react'
import type { ProjectStatus } from '@/types/database'

const statusColors: Record<ProjectStatus, string> = {
  planning: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

const mockProjects = [
  { id: '1', name: 'Riverside Apartments', address: '123 River St, Miami FL', status: 'in_progress' as ProjectStatus, total_sf: 45000, budget_total: 2400000, actual_total: 1800000, start_date: '2025-01-15', end_date: '2025-12-30' },
  { id: '2', name: 'Downtown Office Tower', address: '456 Main Ave, Orlando FL', status: 'planning' as ProjectStatus, total_sf: 120000, budget_total: 8500000, actual_total: 350000, start_date: '2025-06-01', end_date: '2026-08-15' },
  { id: '3', name: 'Sunset Plaza Retail', address: '789 Sunset Blvd, Tampa FL', status: 'in_progress' as ProjectStatus, total_sf: 28000, budget_total: 1200000, actual_total: 920000, start_date: '2025-03-01', end_date: '2025-09-30' },
  { id: '4', name: 'Harbor View Condos', address: '321 Harbor Dr, Fort Lauderdale FL', status: 'on_hold' as ProjectStatus, total_sf: 65000, budget_total: 4200000, actual_total: 1100000, start_date: '2025-02-15', end_date: '2026-02-28' },
]

export default function ProjectsPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = mockProjects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('projects.title')}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />{t('projects.newProject')}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('projects.newProject')}</DialogTitle>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label>{t('projects.projectName')}</Label>
                <Input placeholder="Project name" />
              </div>
              <div className="space-y-2">
                <Label>{t('projects.address')}</Label>
                <Input placeholder="Full address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('projects.totalSF')}</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>{t('projects.budget')}</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('projects.startDate')}</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>{t('projects.endDate')}</Label>
                  <Input type="date" />
                </div>
              </div>
              <Button type="submit" className="w-full">{t('common.create')}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('projects.projectName')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('projects.totalSF')}</TableHead>
                <TableHead className="text-right">{t('projects.costPerSF')}</TableHead>
                <TableHead className="text-right">{t('projects.budget')}</TableHead>
                <TableHead className="text-right">{t('projects.spent')}</TableHead>
                <TableHead>{t('projects.progress')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((project) => {
                const progress = Math.round((project.actual_total / project.budget_total) * 100)
                const costPerSF = project.total_sf ? (project.actual_total / project.total_sf).toFixed(2) : '—'
                return (
                  <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.address}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[project.status]}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{project.total_sf?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${costPerSF}</TableCell>
                    <TableCell className="text-right">${project.budget_total.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${project.actual_total.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="w-20" />
                        <span className="text-sm text-muted-foreground">{progress}%</span>
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
