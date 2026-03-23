export default function EULAPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">End-User License Agreement (EULA)</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold">1. License Grant</h2>
          <p>Effective Gain LLC grants you a non-exclusive, non-transferable, revocable license to use BuildBooks (&quot;EG Build&quot;) for your internal business operations in the construction industry.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Restrictions</h2>
          <p>You may not:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Reverse engineer, decompile, or disassemble the software</li>
            <li>Sublicense, sell, or redistribute access to BuildBooks</li>
            <li>Use the service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to other users&apos; data</li>
            <li>Use automated scripts to extract data beyond API rate limits</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. QuickBooks Integration License</h2>
          <p>BuildBooks uses the QuickBooks Online API under license from Intuit Inc. Your use of QuickBooks features within BuildBooks is subject to Intuit&apos;s terms of service. BuildBooks is not endorsed by, directly affiliated with, or sponsored by Intuit Inc.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. Intellectual Property</h2>
          <p>All rights, title, and interest in BuildBooks remain with Effective Gain LLC. Your data remains your property. The software, including its source code, design, and architecture, is protected by copyright and trade secret laws.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">5. Disclaimer of Warranties</h2>
          <p>THE SOFTWARE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. EFFECTIVE GAIN LLC DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">6. Limitation of Liability</h2>
          <p>IN NO EVENT SHALL EFFECTIVE GAIN LLC BE LIABLE FOR ANY SPECIAL, INCIDENTAL, INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER ARISING OUT OF THE USE OF OR INABILITY TO USE THE SOFTWARE.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">7. Termination</h2>
          <p>This license is effective until terminated. It will terminate automatically if you fail to comply with any term of this agreement. Upon termination, you must cease all use of BuildBooks.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">8. Governing Law</h2>
          <p>This agreement shall be governed by the laws of the State of Florida, United States, without regard to its conflict of law provisions.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">9. Contact</h2>
          <p>For questions: <a href="mailto:info@effectivegain.com" className="text-primary underline">info@effectivegain.com</a></p>
        </section>
      </div>
    </div>
  )
}
