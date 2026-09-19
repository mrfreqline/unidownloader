'use client'
import Link from 'next/link'

export default function TrustSafety() {

  const trustFeatures = [
    { icon: '🔐', title: 'SSL Encryption', desc: 'All data transferred between you and UniDownloader is encrypted end-to-end using SSL/TLS. Your connection is always secure.' },
    { icon: '🔍', title: 'Virus Scanning', desc: 'Every file is scanned before delivery using industry-standard malware detection. We check every download so you do not have to worry.' },
    { icon: '🔢', title: 'File Hash Verification', desc: 'Every downloaded file comes with an MD5 and SHA256 hash so you can verify the file was not tampered with during transfer.' },
    { icon: '🚫', title: 'URL Safety Check', desc: 'Every URL you paste is checked against known malware and scam databases before we process it. Bad links are blocked automatically.' },
    { icon: '📋', title: 'No Log Option', desc: 'You can toggle off download history in Settings. When off, we store zero record of what you downloaded.' },
    { icon: '⚖️', title: 'DMCA Compliance', desc: 'We take copyright seriously. Rights holders can submit takedown requests and we respond within 48 hours.' },
    { icon: '🔒', title: 'Secure Authentication', desc: 'Passwords are hashed using bcrypt. We never store plain text passwords. OAuth logins use industry standard protocols.' },
    { icon: '🌐', title: 'Rate Limiting', desc: 'All API endpoints are rate limited to prevent abuse. Free users get 5 downloads per day to keep the service fair for everyone.' },
    { icon: '👤', title: 'Personal Use Only', desc: 'UniDownloader is built for personal use only. We require all users to agree to our terms before downloading anything.' },
    { icon: '📊', title: 'Transparency Report', desc: 'We publish a monthly transparency report showing takedown requests received, abuse reports, and service uptime statistics.' },
  ]

  const transparencyStats = [
    { label: 'DMCA Takedowns This Month', value: '3' },
    { label: 'Abuse Reports Resolved', value: '12' },
    { label: 'Uptime This Month', value: '99.9%' },
    { label: 'Malicious URLs Blocked', value: '47' },
    { label: 'Files Virus Scanned', value: '8,432' },
    { label: 'Countries Served', value: '140+' },
  ]

  const dmcaItems = [
    'Your full name and contact information',
    'Description of the copyrighted work',
    'URL or description of the infringing content',
    'A statement that you have a good faith belief the use is unauthorized',
    'Your electronic or physical signature',
  ]

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">

      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⬇️</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">UniDownloader</span>
        </Link>
        <div className="flex gap-3">
          <Link href="/login" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition">Login</Link>
          <Link href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition">Sign Up Free</Link>
        </div>
      </nav>

      <section className="text-center px-4 pt-16 pb-10">
        <div className="inline-flex items-center gap-2 bg-green-950 border border-green-800 text-green-400 text-sm px-4 py-1.5 rounded-full mb-6">
          <span>🛡️</span>
          <span>Your safety is our priority</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Trust and Safety</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
          We built UniDownloader with security and transparency at its core.
        </p>
      </section>

      <section className="px-4 pb-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trustFeatures.map((f) => (
            <div key={f.title} className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-green-400 dark:hover:border-green-800 transition">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 max-w-5xl mx-auto">
        <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">📊</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Transparency Report</h2>
              <p className="text-gray-500 text-sm">June 2025 — Updated monthly</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {transparencyStats.map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-500 mb-1">{stat.value}</div>
                <div className="text-gray-500 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 max-w-3xl mx-auto">
        <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">⚖️ DMCA Policy</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            UniDownloader respects intellectual property rights. If you believe content downloaded through our service infringes your copyright, please contact us with the following information:
          </p>
          <div className="flex flex-col gap-2 mb-6">
            {dmcaItems.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="bg-blue-950 border border-blue-800 rounded-xl p-4">
            <p className="text-blue-300 text-sm">
              📧 Send DMCA requests to: <span className="font-semibold text-blue-200">dmca@unidownloader.com</span>
              <br />
              <span className="text-blue-400 text-xs">We respond to all valid requests within 48 hours.</span>
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 max-w-3xl mx-auto">
        <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🔒 Privacy Policy</h2>
          <div className="flex flex-col gap-4 text-sm text-gray-500 leading-relaxed">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">What we collect</h3>
              <p>Email address and name when you sign up. Download history if you have history enabled. Payment info is handled entirely by Stripe — we never see your card details.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">What we never do</h3>
              <p>We never sell your data. We never share your download history with third parties. We never store passwords in plain text.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Cookies</h3>
              <p>We use minimal cookies only for authentication and theme preference. No tracking cookies. No advertising cookies.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Your rights</h3>
              <p>You can request a full export of your data or permanent deletion of your account at any time from Settings.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 max-w-3xl mx-auto">
        <div className="bg-yellow-950 border border-yellow-800 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <h3 className="font-bold text-yellow-300 mb-2">Personal Use Only</h3>
          <p className="text-yellow-400 text-sm leading-relaxed">
            UniDownloader is intended for personal, non-commercial use only.
            Downloading copyrighted content without permission may violate the terms of service of the source platform.
            Always ensure you have the right to download content before doing so.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20 max-w-3xl mx-auto text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Have a safety concern?</h2>
        <p className="text-gray-500 text-sm mb-6">Report abuse, security vulnerabilities, or safety issues directly to our team.</p>
        <Link
          href="mailto:safety@unidownloader.com"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition"
        >
          📧 Contact Safety Team
        </Link>
      </section>

      <footer className="border-t border-gray-200 dark:border-gray-800 px-6 py-6 text-center text-gray-400 dark:text-gray-600 text-sm">
        <p>
          © 2025 UniDownloader • For personal use only •{' '}
          <Link href="/trust" className="hover:text-gray-600 dark:hover:text-gray-400 transition">Privacy</Link> •{' '}
          <Link href="/trust" className="hover:text-gray-600 dark:hover:text-gray-400 transition">DMCA</Link> •{' '}
          <Link href="/pricing" className="hover:text-gray-600 dark:hover:text-gray-400 transition">Pricing</Link>
        </p>
      </footer>

    </main>
  )
}