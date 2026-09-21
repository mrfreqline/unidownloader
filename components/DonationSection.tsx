'use client'

import { useState } from 'react'
import {
  Coffee,
  Heart,
  MessageCircle,
  QrCode,
  Copy,
  Check,
  Share2,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'

interface DonationSectionProps {
  variant?: 'card' | 'full'
  className?: string
}

export default function DonationSection({ variant = 'full', className = '' }: DonationSectionProps) {
  const [copiedNumber, setCopiedNumber] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)

  const phoneNumber = '+977 9716280428'
  const fullIntlNumber = '9779716280428' // WhatsApp wa.me requires country code without +

  const whatsappMessage = encodeURIComponent(
    'Hi A2Z Downloader! I would like to support your free tools and buy you a coffee/tea. Please send me your payment QR code (eSewa / Khalti / Bank QR).'
  )

  const whatsappUrl = `https://wa.me/${fullIntlNumber}?text=${whatsappMessage}`

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(phoneNumber)
    setCopiedNumber(true)
    setTimeout(() => setCopiedNumber(false), 2000)
  }

  const handleShare = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://a2zdownloader.vercel.app'
    if (navigator.share) {
      navigator.share({
        title: 'A2Z Downloader - Fast & Free Media Downloader',
        text: 'Download YouTube, TikTok, Reels, MP3 and more for free with zero retention!',
        url: shareUrl,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareUrl)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2000)
    }
  }

  return (
    <section
      id="donate"
      className={`relative overflow-hidden rounded-3xl border border-amber-500/25 dark:border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-emerald-500/5 to-teal-500/5 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-950 p-5 sm:p-8 shadow-xl transition-all scroll-mt-20 ${className}`}
    >
      {/* Background Decorative Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-5">
        
        {/* Top Badges */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-xs">
          <Coffee className="w-3.5 h-3.5 text-amber-500 fill-current animate-bounce" />
          <span>Support A2Z Downloader</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <Heart className="w-3 h-3 text-red-500 fill-current" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Keep <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">A2Z Downloader</span> Free
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
            All tools and features are <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% free, private, and require no signup</span>.
            Your kind support fuels cloud server hosting, domain renewals, API costs, and continuous new tool development!
          </p>
        </div>

        {/* Payment Gateways Pill Bar */}
        <div className="pt-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2 font-semibold">
            Buy Us a Coffee • Instant QR Payment:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              eSewa
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Khalti
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Bank Mobile Banking / Fonepay QR
            </span>
          </div>
        </div>

        {/* Explainer Box */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed shadow-xs space-y-2">
          <p>
            Click below to open our direct WhatsApp chat. We will personally send you our instant payment QR code so you can buy us a coffee, tea, or fuel server maintenance!
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 pt-1">
            <span>Direct WhatsApp Number:</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono text-xs sm:text-sm">{phoneNumber}</span>
            <button
              onClick={handleCopyNumber}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition text-[11px] cursor-pointer"
              title="Copy phone number"
            >
              {copiedNumber ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedNumber ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {/* Main WhatsApp CTA */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base bg-[#25D366] hover:bg-[#20bd5a] text-white transition shadow-lg shadow-[#25D366]/25 hover:shadow-xl hover:shadow-[#25D366]/35 active:scale-[0.98] cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Message on WhatsApp for QR →</span>
          </a>

          {/* Share A2Z Button */}
          <button
            onClick={handleShare}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            {copiedShare ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share With Friends</span>
              </>
            )}
          </button>
        </div>

        {/* Trust & Guarantee Subtitle */}
        <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1.5 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Direct WhatsApp • Scan via eSewa, Khalti, or Any Mobile Banking App</span>
        </p>

      </div>
    </section>
  )
}
