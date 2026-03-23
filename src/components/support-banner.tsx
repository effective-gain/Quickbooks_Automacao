'use client'

import { MessageCircle, Mail, ExternalLink } from 'lucide-react'

// Customer support contact — required by Intuit app assessment
// "Do you provide customer support contact options within your app?"
export function SupportBanner() {
  return (
    <div className="border-t bg-muted/30 px-4 py-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="font-medium">Need help?</span>
          <a href="mailto:support@effectivegain.com" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Mail className="h-3 w-3" />
            support@effectivegain.com
          </a>
          <a href="https://wa.me/message/effectivegain" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <MessageCircle className="h-3 w-3" />
            WhatsApp
          </a>
        </div>
        <div className="flex items-center gap-3">
          <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="/eula" className="hover:text-foreground transition-colors">EULA</a>
        </div>
      </div>
    </div>
  )
}
