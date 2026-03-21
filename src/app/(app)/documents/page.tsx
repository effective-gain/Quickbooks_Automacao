'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/lib/i18n/context'
import { Send, Upload, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'

const mockDocs = [
  { id: '1', sub: 'ABC Electric', type: 'Certificate of Insurance', status: 'approved', expires: '2026-12-31', file: true },
  { id: '2', sub: 'ABC Electric', type: 'W-9 Form', status: 'approved', expires: null, file: true },
  { id: '3', sub: 'XYZ Plumbing', type: 'Certificate of Insurance', status: 'expired', expires: '2026-01-15', file: true },
  { id: '4', sub: 'XYZ Plumbing', type: 'Lien Waiver', status: 'pending', expires: null, file: false },
  { id: '5', sub: 'Steel Masters Inc', type: 'Certificate of Insurance', status: 'uploaded', expires: '2027-03-01', file: true },
  { id: '6', sub: 'Steel Masters Inc', type: 'W-9 Form', status: 'pending', expires: null, file: false },
  { id: '7', sub: 'Cool Air HVAC', type: 'Certificate of Insurance', status: 'rejected', expires: null, file: true },
  { id: '8', sub: 'Cool Air HVAC', type: 'License', status: 'approved', expires: '2027-06-30', file: true },
  { id: '9', sub: 'Foundation Pro LLC', type: 'Certificate of Insurance', status: 'approved', expires: '2026-09-15', file: true },
  { id: '10', sub: 'Foundation Pro LLC', type: 'W-9 Form', status: 'approved', expires: null, file: true },
]

const statusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  uploaded: { icon: Upload, color: 'bg-blue-100 text-blue-800', label: 'Uploaded' },
  approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Approved' },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' },
  expired: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-800', label: 'Expired' },
}

const subs = [...new Set(mockDocs.map(d => d.sub))]

export default function DocumentsPage() {
  const { t } = useI18n()
  const totalDocs = mockDocs.length
  const approved = mockDocs.filter(d => d.status === 'approved').length
  const compliance = Math.round((approved / totalDocs) * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('documents.title')}</h1>
        <Button><Send className="mr-2 h-4 w-4" />{t('documents.requestDocument')}</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Overall Compliance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold">{compliance}%</div>
              <Progress value={compliance} className="flex-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Documents</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{mockDocs.filter(d => d.status === 'pending').length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Expired / Rejected</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{mockDocs.filter(d => d.status === 'expired' || d.status === 'rejected').length}</div></CardContent>
        </Card>
      </div>

      {subs.map((sub) => {
        const docs = mockDocs.filter(d => d.sub === sub)
        const subApproved = docs.filter(d => d.status === 'approved').length
        const subCompliance = Math.round((subApproved / docs.length) * 100)

        return (
          <Card key={sub}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{sub}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{subCompliance}% compliant</span>
                  <Progress value={subCompliance} className="w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('documents.documentType')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('documents.expiresAt')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((doc) => {
                    const config = statusConfig[doc.status as keyof typeof statusConfig]
                    const Icon = config.icon
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.type}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={config.color}>
                            <Icon className="mr-1 h-3 w-3" />{config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.expires || '—'}</TableCell>
                        <TableCell>
                          {doc.status === 'pending' && <Button size="sm" variant="outline"><Send className="mr-1 h-3 w-3" />Remind via WhatsApp</Button>}
                          {doc.status === 'uploaded' && <Button size="sm" variant="outline">Review</Button>}
                          {doc.status === 'expired' && <Button size="sm" variant="destructive"><Send className="mr-1 h-3 w-3" />Request Renewal</Button>}
                          {doc.status === 'rejected' && <Button size="sm" variant="destructive"><Send className="mr-1 h-3 w-3" />Re-request</Button>}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
