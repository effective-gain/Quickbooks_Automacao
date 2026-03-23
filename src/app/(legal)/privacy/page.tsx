export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Effective Date: March 23, 2026 | Last updated: March 23, 2026</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p>Effective Gain LLC (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the BuildBooks platform (&quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.</p>
          <p>This policy applies to all users of BuildBooks, including Administrators, General Contractors, Subcontractors, and Accountants operating in the United States construction market.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Information We Collect</h2>

          <h3 className="text-lg font-medium mt-4">2.1 Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Account registration:</strong> Name, email address, phone number, company name, role</li>
            <li><strong>Company information:</strong> Business name, EIN (Employer Identification Number), business address</li>
            <li><strong>Subcontractor data:</strong> Name, trade, contact information, EIN, compliance documents (W-9 forms, Certificates of Insurance, Lien Waivers, licenses)</li>
            <li><strong>Project data:</strong> Project names, addresses, budgets, cost entries, takeoff quantities</li>
            <li><strong>Financial data:</strong> Invoice details, payment records, bank transaction descriptions</li>
          </ul>

          <h3 className="text-lg font-medium mt-4">2.2 Information from QuickBooks Online</h3>
          <p>When you connect your QuickBooks Online account via OAuth 2.0, we access:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Chart of accounts, classes, and departments</li>
            <li>Customer and vendor records</li>
            <li>Invoices, bills, purchases, payments, and estimates</li>
            <li>Items (products and services)</li>
            <li>Financial reports (Profit &amp; Loss, Balance Sheet)</li>
          </ul>
          <p className="mt-2"><strong>We do NOT access:</strong> Payroll data, payment processing data, bank account credentials, or Social Security Numbers through the QuickBooks API.</p>

          <h3 className="text-lg font-medium mt-4">2.3 Information from Communication Channels</h3>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>WhatsApp voice messages:</strong> When you use the voice-to-data feature, audio is transcribed using OpenAI Whisper and the transcript is processed to extract structured financial data. Audio files are not permanently stored.</li>
            <li><strong>WhatsApp text messages:</strong> Messages sent to the BuildBooks number are processed for intent detection (expense reports, document submissions, etc.)</li>
          </ul>

          <h3 className="text-lg font-medium mt-4">2.4 Automatically Collected Information</h3>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>IP address, browser type, device information</li>
            <li>Pages visited, time spent, and usage patterns within the Service</li>
            <li>API request logs (for debugging and security purposes)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>To provide, operate, and maintain the BuildBooks platform</li>
            <li>To synchronize financial data with your QuickBooks Online account</li>
            <li>To automatically categorize transactions based on your configured rules</li>
            <li>To generate financial reports, KPIs, and cost-per-square-foot analysis</li>
            <li>To create and send invoices, manage bills, and track payments</li>
            <li>To manage subcontractor compliance documents and send reminders</li>
            <li>To process construction plan takeoffs and generate budget estimates</li>
            <li>To send notifications via WhatsApp or email regarding project updates</li>
            <li>To provide customer support and respond to inquiries</li>
            <li>To detect, prevent, and address technical issues and security threats</li>
          </ul>
          <p className="mt-4"><strong>We do NOT use your data for:</strong></p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Marketing or advertising purposes unrelated to the Service</li>
            <li>Selling, renting, or sharing with third parties for their marketing purposes</li>
            <li>Profiling, credit scoring, or lending decisions</li>
            <li>Any purpose other than providing the BuildBooks service to you</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. Data Storage, Security &amp; Residency</h2>
          <p>Your data is stored and processed entirely within the United States:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Database:</strong> Supabase (PostgreSQL on AWS US East)</li>
            <li><strong>Application:</strong> Vercel (US Edge Network)</li>
            <li><strong>File storage:</strong> Supabase Storage (AWS S3 US)</li>
          </ul>
          <p className="mt-2">Security measures include:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>All data encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
            <li>Row Level Security (RLS) enforced at the database level — users can only access data belonging to their company</li>
            <li>OAuth 2.0 tokens stored encrypted in the database, never exposed to client-side code</li>
            <li>Client ID and Client Secret stored as environment variables, never hardcoded</li>
            <li>Webhook signatures verified using HMAC-SHA256 with timing-safe comparison</li>
            <li>API error logging includes Intuit transaction IDs (intuit_tid) for troubleshooting</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Third-Party Services</h2>
          <p>BuildBooks integrates with the following third-party services, each with their own privacy policies:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Intuit QuickBooks Online:</strong> Financial data synchronization — <a href="https://www.intuit.com/privacy/" className="text-primary underline">Intuit Privacy Policy</a></li>
            <li><strong>Supabase:</strong> Database, authentication, and file storage — <a href="https://supabase.com/privacy" className="text-primary underline">Supabase Privacy Policy</a></li>
            <li><strong>Vercel:</strong> Application hosting — <a href="https://vercel.com/legal/privacy-policy" className="text-primary underline">Vercel Privacy Policy</a></li>
            <li><strong>OpenAI:</strong> Audio transcription (Whisper API) — <a href="https://openai.com/privacy" className="text-primary underline">OpenAI Privacy Policy</a></li>
            <li><strong>Evolution API:</strong> WhatsApp messaging gateway</li>
          </ul>
          <p className="mt-2">We do not share your QuickBooks data with any third party except as necessary to operate the Service (e.g., storing it in our database).</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Data Isolation</h2>
          <p>BuildBooks enforces strict data isolation between companies. Once customer data enters our system, it is restricted to that customer only through database-level Row Level Security policies. No user can access data belonging to another company, regardless of their role.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Your Rights</h2>

          <h3 className="text-lg font-medium mt-4">All Users</h3>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Disconnect:</strong> Revoke QuickBooks access at any time from the integration page or the QuickBooks App Store</li>
            <li><strong>Data Export:</strong> Request a complete export of your data in standard formats</li>
            <li><strong>Data Deletion:</strong> Request permanent deletion of all your data</li>
            <li><strong>Access:</strong> Request a summary of all data we hold about you or your company</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
          </ul>

          <h3 className="text-lg font-medium mt-4">California Residents (CCPA)</h3>
          <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Right to know what personal information we collect and how we use it</li>
            <li>Right to delete your personal information</li>
            <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
            <li>Right to non-discrimination for exercising your CCPA rights</li>
          </ul>

          <h3 className="text-lg font-medium mt-4">To Exercise Your Rights</h3>
          <p>Submit a request to <a href="mailto:privacy@effectivegain.com" className="text-primary underline">privacy@effectivegain.com</a>. We will respond within 30 days.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Data Retention</h2>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Active accounts:</strong> Data is retained for the duration of your subscription</li>
            <li><strong>After termination:</strong> Data is retained for 30 days, then permanently deleted</li>
            <li><strong>OAuth tokens:</strong> Revoked immediately upon disconnection</li>
            <li><strong>Audio files:</strong> Processed and discarded; only transcripts are stored</li>
            <li><strong>API logs:</strong> Retained for 90 days for debugging purposes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">9. Children&apos;s Privacy</h2>
          <p>BuildBooks is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and, where applicable, by email notification. Your continued use of the Service after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">11. Contact Information</h2>
          <p>For privacy questions, data requests, or concerns:</p>
          <p className="mt-2">Effective Gain LLC</p>
          <p>Email: <a href="mailto:privacy@effectivegain.com" className="text-primary underline">privacy@effectivegain.com</a></p>
          <p>General: <a href="mailto:info@effectivegain.com" className="text-primary underline">info@effectivegain.com</a></p>
          <p>Website: <a href="https://effectivegain.com" className="text-primary underline">effectivegain.com</a></p>
        </section>
      </div>
    </div>
  )
}
