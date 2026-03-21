'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useI18n } from '@/lib/i18n/context'
import { Upload, FileText, Send, Loader2 } from 'lucide-react'

const mockTakeoffItems = [
  { id: '1', description: 'Concrete Foundation', quantity: 450, unit: 'CY', unit_cost: 185, total_cost: 83250 },
  { id: '2', description: 'Structural Steel', quantity: 28, unit: 'TON', unit_cost: 3200, total_cost: 89600 },
  { id: '3', description: 'Framing Lumber 2x6', quantity: 12500, unit: 'LF', unit_cost: 4.50, total_cost: 56250 },
  { id: '4', description: 'Drywall 5/8"', quantity: 18000, unit: 'SF', unit_cost: 2.80, total_cost: 50400 },
  { id: '5', description: 'Electrical Rough-In', quantity: 45000, unit: 'SF', unit_cost: 8.50, total_cost: 382500 },
  { id: '6', description: 'Plumbing Rough-In', quantity: 45000, unit: 'SF', unit_cost: 7.20, total_cost: 324000 },
  { id: '7', description: 'HVAC Ductwork', quantity: 45000, unit: 'SF', unit_cost: 6.80, total_cost: 306000 },
  { id: '8', description: 'Roofing - TPO', quantity: 15000, unit: 'SF', unit_cost: 12.50, total_cost: 187500 },
]

export default function TakeoffPage() {
  const { t } = useI18n()
  const [uploaded, setUploaded] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [ready, setReady] = useState(false)

  function handleUpload() {
    setUploaded(true)
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      setReady(true)
    }, 2000)
  }

  const total = mockTakeoffItems.reduce((sum, item) => sum + item.total_cost, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('takeoff.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('takeoff.uploadPlan')}</CardTitle>
          <CardDescription>Upload PDF or image files of construction plans for automated quantity extraction</CardDescription>
        </CardHeader>
        <CardContent>
          {!uploaded ? (
            <div
              onClick={handleUpload}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition hover:border-primary hover:bg-muted/50"
            >
              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Drop construction plans here</p>
              <p className="text-sm text-muted-foreground">PDF, DWG, JPG, PNG up to 50MB</p>
            </div>
          ) : processing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">{t('takeoff.processing')}</p>
              <p className="text-sm text-muted-foreground">Analyzing plan dimensions and quantities...</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Riverside_Apartments_Floor_Plan.pdf</p>
                <p className="text-sm text-muted-foreground">45,000 SF - 3 stories - Uploaded just now</p>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800">Ready</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {ready && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('takeoff.generateQuantities')}</h2>
            <Button><Send className="mr-2 h-4 w-4" />{t('takeoff.sendToBudget')}</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.description')}</TableHead>
                    <TableHead className="text-right">{t('takeoff.quantity')}</TableHead>
                    <TableHead>{t('takeoff.unit')}</TableHead>
                    <TableHead className="text-right">{t('takeoff.unitCost')}</TableHead>
                    <TableHead className="text-right">{t('takeoff.totalCost')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTakeoffItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right">${item.unit_cost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.total_cost.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell colSpan={4} className="text-right">{t('common.total')}</TableCell>
                    <TableCell className="text-right">${total.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
