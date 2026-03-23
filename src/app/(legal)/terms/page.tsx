export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p>By accessing and using BuildBooks (&quot;EG Build&quot;), a product of Effective Gain LLC, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Description of Service</h2>
          <p>BuildBooks is a construction project management and financial automation platform that integrates with QuickBooks Online, banking systems, and communication tools to streamline construction business operations.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. QuickBooks Integration</h2>
          <p>BuildBooks connects to your QuickBooks Online account via Intuit&apos;s OAuth 2.0 API. By connecting, you authorize BuildBooks to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Read your chart of accounts, customers, vendors, and transactions</li>
            <li>Create and update invoices, bills, purchases, and journal entries</li>
            <li>Sync financial data for reporting and cost tracking purposes</li>
          </ul>
          <p className="mt-2">You may disconnect your QuickBooks account at any time from the Settings page, which will revoke all access.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. User Accounts &amp; Roles</h2>
          <p>BuildBooks supports multiple user roles: Administrator, General Contractor, Subcontractor, and Accountant. Each role has specific permissions. Account administrators are responsible for managing user access within their organization.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Data Ownership</h2>
          <p>You retain all ownership rights to your data. BuildBooks stores data in Supabase (hosted by AWS) and processes it solely for providing the service. We do not sell, share, or use your data for purposes other than operating the platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Limitation of Liability</h2>
          <p>BuildBooks is provided &quot;as is&quot; without warranty of any kind. Effective Gain LLC shall not be liable for any indirect, incidental, or consequential damages arising from the use of this service, including but not limited to financial discrepancies resulting from API synchronization.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Termination</h2>
          <p>Either party may terminate this agreement at any time. Upon termination, your QuickBooks connection will be revoked and your data will be retained for 30 days before permanent deletion unless otherwise requested.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Contact</h2>
          <p>For questions about these terms, contact: <a href="mailto:info@effectivegain.com" className="text-primary underline">info@effectivegain.com</a></p>
        </section>
      </div>
    </div>
  )
}
