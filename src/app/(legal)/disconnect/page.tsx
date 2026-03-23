import Link from 'next/link'

// Static disconnect page — required by Intuit
// When users disconnect from the QuickBooks App Store,
// they are taken to this static page.
export default function DisconnectPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center space-y-6 p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"/>
            <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground"/>
          </svg>
        </div>

        <h1 className="text-2xl font-bold">QuickBooks Disconnected</h1>

        <p className="text-muted-foreground">
          Your QuickBooks Online account has been successfully disconnected from BuildBooks.
          Your financial data will no longer be synchronized.
        </p>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Your project data, documents, and settings in BuildBooks remain intact.</p>
          <p>You can reconnect at any time from the QuickBooks integration page.</p>
        </div>

        <div className="pt-4 flex flex-col gap-2">
          <Link
            href="/quickbooks"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Reconnect QuickBooks
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
