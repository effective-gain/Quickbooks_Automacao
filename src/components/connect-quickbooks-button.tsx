'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

// Official Intuit "Connect to QuickBooks" button
// Uses the approved SVG from Intuit developer guidelines
// https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0

export function ConnectQuickBooksButton() {
  const [loading, setLoading] = useState(false)

  const handleConnect = () => {
    setLoading(true)
    window.location.href = '/api/quickbooks/connect'
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={loading}
      className="h-12 gap-3 bg-[#2CA01C] px-6 text-white hover:bg-[#1A8A10] disabled:opacity-50"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="white"/>
        <path d="M6.5 7C5.67 7 5 7.67 5 8.5V15.5C5 16.33 5.67 17 6.5 17H8V8.5C8 7.67 7.33 7 6.5 7Z" fill="#2CA01C"/>
        <path d="M10 7V15.5C10 16.33 10.67 17 11.5 17C12.33 17 13 16.33 13 15.5V7H10Z" fill="#2CA01C"/>
        <path d="M15 7V15.5C15 16.33 15.67 17 16.5 17H17.5C18.33 17 19 16.33 19 15.5V8.5C19 7.67 18.33 7 17.5 7H15Z" fill="#2CA01C"/>
      </svg>
      {loading ? 'Connecting...' : 'Connect to QuickBooks'}
    </Button>
  )
}

export function DisconnectQuickBooksButton({ onDisconnect }: { onDisconnect: () => void }) {
  const [loading, setLoading] = useState(false)

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      await fetch('/api/quickbooks/disconnect', { method: 'POST' })
      onDisconnect()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleDisconnect}
      disabled={loading}
      variant="destructive"
      size="sm"
    >
      {loading ? 'Disconnecting...' : 'Disconnect'}
    </Button>
  )
}
