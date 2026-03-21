'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useI18n } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/types'

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('common.settings')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input defaultValue="Luiz Alberto" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="luiz@effectivegain.com" disabled />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input defaultValue="+1 (305) 555-0100" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input defaultValue="Administrator" disabled />
            </div>
          </div>
          <Button>{t('common.save')}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language / Idioma / Idioma</CardTitle>
          <CardDescription>The system stores data in English and displays in your preferred language</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display Language</Label>
            <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
              <SelectTrigger className="w-[250px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="pt-BR">Portugues (Brasil)</SelectItem>
                <SelectItem value="es">Espanol</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
          <CardDescription>Your company details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input defaultValue="BuildCo Construction LLC" />
            </div>
            <div className="space-y-2">
              <Label>EIN</Label>
              <Input defaultValue="XX-XXXXXXX" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input defaultValue="123 Business Ave, Miami, FL 33101" />
          </div>
          <Button>{t('common.save')}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Manage external service connections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">QuickBooks Online</p>
              <p className="text-sm text-muted-foreground">Connected as BuildCo Construction LLC</p>
            </div>
            <Button variant="outline" render={<a href="/quickbooks" />}>Manage</Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">WhatsApp Business</p>
              <p className="text-sm text-muted-foreground">Connected via n8n webhook</p>
            </div>
            <Button variant="outline">Configure</Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">n8n Workflows</p>
              <p className="text-sm text-muted-foreground">5 active workflows</p>
            </div>
            <Button variant="outline">Manage</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
