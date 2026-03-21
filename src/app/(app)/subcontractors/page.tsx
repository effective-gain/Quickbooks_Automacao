'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useI18n } from '@/lib/i18n/context'
import { Plus, Search, CheckCircle, AlertTriangle } from 'lucide-react'

const mockSubs = [
  { id: '1', name: 'ABC Electric', trade: 'Electrical', email: 'info@abcelectric.com', phone: '(305) 555-0101', is_compliant: true, active_projects: 2 },
  { id: '2', name: 'XYZ Plumbing', trade: 'Plumbing', email: 'contact@xyzplumbing.com', phone: '(305) 555-0102', is_compliant: false, active_projects: 1 },
  { id: '3', name: 'Steel Masters Inc', trade: 'Structural Steel', email: 'info@steelmasters.com', phone: '(305) 555-0103', is_compliant: false, active_projects: 1 },
  { id: '4', name: 'Cool Air HVAC', trade: 'HVAC', email: 'service@coolair.com', phone: '(305) 555-0104', is_compliant: false, active_projects: 1 },
  { id: '5', name: 'Foundation Pro LLC', trade: 'Foundation', email: 'bid@foundationpro.com', phone: '(305) 555-0105', is_compliant: true, active_projects: 2 },
  { id: '6', name: 'Prime Roofing Co', trade: 'Roofing', email: 'ops@primeroofing.com', phone: '(305) 555-0106', is_compliant: true, active_projects: 1 },
]

export default function SubcontractorsPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')

  const filtered = mockSubs.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.trade.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('common.subcontractors')}</h1>
        <Button><Plus className="mr-2 h-4 w-4" />{t('common.create')}</Button>
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
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>Trade</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.name}</TableCell>
                  <TableCell>{sub.trade}</TableCell>
                  <TableCell>{sub.email}</TableCell>
                  <TableCell>{sub.phone}</TableCell>
                  <TableCell>{sub.active_projects}</TableCell>
                  <TableCell>
                    {sub.is_compliant ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />Compliant
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        <AlertTriangle className="mr-1 h-3 w-3" />Missing Docs
                      </Badge>
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
    </div>
  )
}
