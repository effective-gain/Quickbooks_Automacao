'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FolderKanban, Ruler, Calculator, DollarSign,
  FileText, ShieldCheck, Users, Landmark, Link2, Zap, BarChart3, Settings,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar'
import { useI18n } from '@/lib/i18n/context'

const navItems = [
  { key: 'common.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'common.projects', href: '/projects', icon: FolderKanban },
  { key: 'common.takeoff', href: '/takeoff', icon: Ruler },
  { key: 'common.budgets', href: '/budgets', icon: Calculator },
  { key: 'common.costControl', href: '/cost-control', icon: DollarSign },
  { key: 'common.invoices', href: '/invoices', icon: FileText },
  { key: 'common.documents', href: '/documents', icon: ShieldCheck },
  { key: 'common.subcontractors', href: '/subcontractors', icon: Users },
  { key: 'common.banking', href: '/banking', icon: Landmark },
  { key: 'common.quickbooks', href: '/quickbooks', icon: Link2 },
  { key: 'common.automation', href: '/automation', icon: Zap },
  { key: 'common.reports', href: '/reports', icon: BarChart3 },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <DollarSign className="h-6 w-6 text-primary" />
          <span>BuildBooks</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton render={<Link href={item.href} />} isActive={pathname.startsWith(item.href)}>
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.key)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/settings" />} isActive={pathname === '/settings'}>
              <Settings className="h-4 w-4" />
              <span>{t('common.settings')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
