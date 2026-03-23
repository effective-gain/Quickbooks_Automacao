export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Effective Date: March 23, 2026 | Last updated: March 23, 2026</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold">1. Agreement to Terms</h2>
          <p>These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and Effective Gain LLC, a company registered in the United States (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), governing your access to and use of the BuildBooks platform (&quot;Service&quot;).</p>
          <p>By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you are using the Service on behalf of a business entity, you represent that you have the authority to bind that entity to these Terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Service Description</h2>
          <p>BuildBooks is a construction project management and financial automation platform designed for the United States construction market. The Service integrates with Intuit QuickBooks Online via authorized OAuth 2.0 APIs to provide:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Automated financial entry creation and categorization in QuickBooks Online</li>
            <li>Construction cost tracking by cost center, category, and square footage</li>
            <li>Invoice generation and management</li>
            <li>Subcontractor compliance document management (W-9, Certificates of Insurance, Lien Waivers)</li>
            <li>Construction plan takeoff and budget estimation</li>
            <li>Banking reconciliation and reporting</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. Intuit QuickBooks Online Integration</h2>
          <p>BuildBooks is a third-party application that connects to QuickBooks Online through Intuit&apos;s official OAuth 2.0 API. BuildBooks is not endorsed by, directly affiliated with, maintained, authorized, or sponsored by Intuit Inc.</p>
          <p className="mt-2">By connecting your QuickBooks Online account, you explicitly authorize BuildBooks to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Read your chart of accounts, customers, vendors, items, classes, and departments</li>
            <li>Read and create invoices, bills, purchases, payments, estimates, and journal entries</li>
            <li>Access financial reports (Profit &amp; Loss, Balance Sheet)</li>
            <li>Receive real-time webhook notifications for data changes in your QuickBooks account</li>
          </ul>
          <p className="mt-2"><strong>Scope limitation:</strong> BuildBooks uses the <code>com.intuit.quickbooks.accounting</code> scope only. We do not access payment processing (<code>com.intuit.quickbooks.payment</code>) or payroll data.</p>
          <p className="mt-2"><strong>Disconnection:</strong> You may disconnect your QuickBooks account at any time through the QuickBooks integration page in BuildBooks or through the QuickBooks App Store. Upon disconnection, all API access is immediately revoked and you will be directed to a static confirmation page.</p>
          <p className="mt-2"><strong>Data usage:</strong> QuickBooks customer data is used exclusively to provide products and services to you. We do not use your QuickBooks data for any other purpose, including but not limited to marketing, profiling, or resale.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. User Accounts, Roles &amp; Access</h2>
          <p>BuildBooks supports the following user roles, each with distinct access levels:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Administrator:</strong> Full access to all features, settings, QuickBooks connection, and user management</li>
            <li><strong>General Contractor:</strong> Access to projects, cost control, invoicing, and reports</li>
            <li><strong>Subcontractor:</strong> Limited access to assigned projects, document uploads, and budget responses</li>
            <li><strong>Accountant:</strong> Access to financial data, QuickBooks sync, banking, and reports</li>
          </ul>
          <p className="mt-2">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Data Ownership &amp; Residency</h2>
          <p>You retain all ownership rights to your data. BuildBooks processes and stores your data using the following infrastructure located in the United States:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Database:</strong> Supabase (PostgreSQL hosted on AWS, US regions)</li>
            <li><strong>Application hosting:</strong> Vercel (US regions)</li>
            <li><strong>File storage:</strong> Supabase Storage (AWS S3, US regions)</li>
          </ul>
          <p className="mt-2">All data processing occurs within the United States. We do not transfer your financial data outside the United States.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Use the Service for any illegal purpose or in violation of any applicable law</li>
            <li>Attempt to access data belonging to other users or companies</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            <li>Exceed API rate limits or use automated tools to extract data beyond normal usage</li>
            <li>Misrepresent your identity or authority when connecting QuickBooks accounts</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Payment &amp; Fees</h2>
          <p>Pricing for BuildBooks is determined by your subscription plan. Current pricing is available upon request. We reserve the right to modify pricing with 30 days&apos; notice.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Disclaimer of Warranties</h2>
          <p>THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. EFFECTIVE GAIN LLC DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">9. Limitation of Liability</h2>
          <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, EFFECTIVE GAIN LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE. THIS INCLUDES ANY FINANCIAL DISCREPANCIES ARISING FROM API SYNCHRONIZATION WITH QUICKBOOKS ONLINE.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">10. Indemnification</h2>
          <p>You agree to indemnify and hold harmless Effective Gain LLC, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses arising from your use of the Service or violation of these Terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">11. Termination</h2>
          <p>Either party may terminate this agreement at any time. Upon termination:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Your QuickBooks connection will be immediately revoked</li>
            <li>Your data will be retained for 30 days, after which it will be permanently deleted</li>
            <li>You may request immediate data deletion or a data export before the retention period ends</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">12. Governing Law &amp; Dispute Resolution</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the State of Florida, United States, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved through binding arbitration in the State of Florida.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">13. Changes to Terms</h2>
          <p>We may update these Terms from time to time. We will notify you of any material changes by posting the new Terms on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after such changes constitutes acceptance of the updated Terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">14. Contact Information</h2>
          <p>Effective Gain LLC</p>
          <p>Email: <a href="mailto:info@effectivegain.com" className="text-primary underline">info@effectivegain.com</a></p>
          <p>Website: <a href="https://effectivegain.com" className="text-primary underline">effectivegain.com</a></p>
        </section>
      </div>
    </div>
  )
}
