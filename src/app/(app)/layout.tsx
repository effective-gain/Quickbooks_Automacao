import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { I18nProvider } from '@/lib/i18n/context'
import { getDictionary, defaultLocale } from '@/lib/i18n'
import { getProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { Locale } from '@/lib/i18n/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const locale = (profile.locale || defaultLocale) as Locale
  const dictionary = await getDictionary(locale)

  return (
    <I18nProvider initialDictionary={dictionary} initialLocale={locale}>
      <TooltipProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex flex-1 flex-col">
              <AppHeader userName={profile.full_name} />
              <main className="flex-1 p-6">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </I18nProvider>
  )
}
