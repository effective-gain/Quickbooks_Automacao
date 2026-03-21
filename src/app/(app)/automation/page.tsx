'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n/context'
import { Zap, MessageCircle, Mail, Bell, Plus, Play, Pause } from 'lucide-react'

const mockAutomations = [
  {
    id: '1',
    name: 'Document Reminder - WhatsApp',
    description: 'Send WhatsApp reminder to subs with pending documents every Monday at 9 AM',
    trigger: 'Scheduled (Weekly)',
    channel: 'WhatsApp',
    active: true,
    lastRun: '2026-03-17 09:00',
    icon: MessageCircle,
  },
  {
    id: '2',
    name: 'Invoice Overdue Alert',
    description: 'When an invoice is overdue by 7 days, notify admin via WhatsApp and email',
    trigger: 'Event (Invoice overdue)',
    channel: 'WhatsApp + Email',
    active: true,
    lastRun: '2026-03-19 14:22',
    icon: Bell,
  },
  {
    id: '3',
    name: 'QuickBooks Daily Sync',
    description: 'Sync all QB data every day at 6 AM',
    trigger: 'Scheduled (Daily)',
    channel: 'n8n Workflow',
    active: true,
    lastRun: '2026-03-20 06:00',
    icon: Zap,
  },
  {
    id: '4',
    name: 'Budget Overage Alert',
    description: 'When a cost category exceeds 90% of budget, notify project manager',
    trigger: 'Event (Cost entry)',
    channel: 'WhatsApp + In-App',
    active: true,
    lastRun: '2026-03-18 16:45',
    icon: Bell,
  },
  {
    id: '5',
    name: 'New Sub Onboarding',
    description: 'When a new subcontractor is added, send document request package via WhatsApp',
    trigger: 'Event (Sub created)',
    channel: 'WhatsApp',
    active: true,
    lastRun: '2026-03-15 11:30',
    icon: MessageCircle,
  },
  {
    id: '6',
    name: 'Weekly Cost Report',
    description: 'Generate and email weekly cost report to accountant every Friday at 5 PM',
    trigger: 'Scheduled (Weekly)',
    channel: 'Email',
    active: false,
    lastRun: '2026-03-14 17:00',
    icon: Mail,
  },
  {
    id: '7',
    name: 'Takeoff Budget Dispatch',
    description: 'When takeoff is marked as ready, send budget request to selected subs via WhatsApp',
    trigger: 'Event (Takeoff ready)',
    channel: 'WhatsApp',
    active: true,
    lastRun: '2026-03-12 10:15',
    icon: MessageCircle,
  },
]

export default function AutomationPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('common.automation')}</h1>
        <Button><Plus className="mr-2 h-4 w-4" />New Automation</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Automations</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{mockAutomations.filter(a => a.active).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">WhatsApp Messages (This Month)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">147</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">n8n Workflows</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">5</div></CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {mockAutomations.map((auto) => {
          const Icon = auto.icon
          return (
            <Card key={auto.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{auto.name}</p>
                  <p className="text-sm text-muted-foreground">{auto.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Trigger: {auto.trigger}</span>
                    <span>Channel: {auto.channel}</span>
                    <span>Last run: {auto.lastRun}</span>
                  </div>
                </div>
                <Badge variant="outline" className={auto.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}>
                  {auto.active ? 'Active' : 'Paused'}
                </Badge>
                <Button variant="ghost" size="icon">
                  {auto.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm">{t('common.edit')}</Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
