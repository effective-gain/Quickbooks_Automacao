export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <p>BuildBooks (&quot;EG Build&quot;) by Effective Gain LLC collects the following information:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Account Information:</strong> Name, email address, phone number, role, and company details provided during registration.</li>
            <li><strong>QuickBooks Data:</strong> Financial data accessed through the QuickBooks Online API, including accounts, transactions, invoices, bills, vendors, and customers. This data is accessed only with your explicit OAuth 2.0 authorization.</li>
            <li><strong>Project Data:</strong> Construction project details, cost entries, takeoff quantities, budgets, and documents you upload or create within the platform.</li>
            <li><strong>Communication Data:</strong> WhatsApp messages and voice transcriptions processed through our automation workflows, only when you explicitly use these features.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>To provide and operate the BuildBooks platform</li>
            <li>To synchronize data with your QuickBooks Online account</li>
            <li>To generate reports, track KPIs, and calculate cost per square foot</li>
            <li>To automate categorization of transactions based on your configured rules</li>
            <li>To send notifications via WhatsApp or email for document requests, invoice updates, and budget dispatches</li>
            <li>To transcribe voice messages for automated data entry</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. Data Storage &amp; Security</h2>
          <p>Your data is stored in Supabase (PostgreSQL hosted by AWS) with Row Level Security (RLS) policies enforced. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). OAuth tokens for QuickBooks are stored encrypted and are never exposed to client-side code.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. Third-Party Services</h2>
          <p>BuildBooks integrates with the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Intuit QuickBooks Online:</strong> Financial data synchronization</li>
            <li><strong>Supabase:</strong> Database and authentication</li>
            <li><strong>OpenAI Whisper:</strong> Audio transcription (voice messages)</li>
            <li><strong>Evolution API:</strong> WhatsApp messaging</li>
            <li><strong>n8n:</strong> Workflow automation</li>
            <li><strong>Vercel:</strong> Application hosting</li>
          </ul>
          <p className="mt-2">Each service has its own privacy policy. We recommend reviewing them.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Data Sharing</h2>
          <p>We do <strong>not</strong> sell, rent, or share your personal or financial data with third parties for marketing purposes. Data is shared only with the third-party services listed above, solely for the purpose of providing the BuildBooks service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Your Rights</h2>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Disconnect:</strong> You may disconnect your QuickBooks account at any time, which revokes all API access.</li>
            <li><strong>Data Export:</strong> You may request a full export of your data at any time.</li>
            <li><strong>Data Deletion:</strong> You may request complete deletion of your data. Upon request, all data will be permanently removed within 30 days.</li>
            <li><strong>Access:</strong> You may request to see what data we hold about you.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Data Retention</h2>
          <p>We retain your data for as long as your account is active. After account termination, data is retained for 30 days before permanent deletion, unless you request immediate deletion or legal obligations require longer retention.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Contact</h2>
          <p>For privacy questions or data requests: <a href="mailto:info@effectivegain.com" className="text-primary underline">info@effectivegain.com</a></p>
          <p>Effective Gain LLC<br />United States</p>
        </section>
      </div>
    </div>
  )
}
