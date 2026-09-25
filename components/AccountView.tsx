'use client'

import { useState } from 'react'
import {
  User,
  Crown,
  Sparkles,
  Zap,
  Coins,
  ShieldCheck,
  Check,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Coffee,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  MessageCircle,
  Clock,
  Film,
  Download,
  Flame,
} from 'lucide-react'

interface AccountViewProps {
  tokens: number
  guestTrials: number
  isLoggedIn: boolean
  userEmail?: string
  theme: 'light' | 'dark' | 'system'
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void
  onOpenAuthModal: () => void
  onOpenTokenModal: () => void
  onOpenAppModal?: () => void
}

export default function AccountView({
  tokens,
  guestTrials,
  isLoggedIn,
  userEmail,
  theme,
  onThemeChange,
  onOpenAuthModal,
  onOpenTokenModal,
  onOpenAppModal,
}: AccountViewProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [openSection, setOpenSection] = useState<'platforms' | 'apps' | 'legal' | null>(null)

  const toggleFaq = (idx: number) => {
    setOpenFaq(prev => (prev === idx ? null : idx))
  }

  const toggleSection = (sec: 'platforms' | 'apps' | 'legal') => {
    setOpenSection(prev => (prev === sec ? null : sec))
  }

  // Pre-filled WhatsApp activation links
  const getWhatsAppUrl = (planName: string) => {
    const text = encodeURIComponent(
      `Hello A2Z Downloader Support! I would like to activate the ${planName} subscription for my account (${userEmail || 'Guest'}).`
    )
    return `https://wa.me/9779800000000?text=${text}` // Customizable support number
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Header section */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Account & Settings</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-heading">
          Account & <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Preferences</span>
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl">
          Manage your downloads quota, subscription plans, app settings, and privacy controls all in one place.
        </p>
      </div>

      {/* Grid: Profile & Quota Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* User Status Card */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-wider text-zinc-400">Profile Status</span>
              {isLoggedIn ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                  <Check className="w-3 h-3" /> Signed in
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                  Guest Session
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full bg-[#12151a] rounded-[10px] flex items-center justify-center text-emerald-400 font-bold text-lg">
                  {isLoggedIn && userEmail ? userEmail.charAt(0).toUpperCase() : <User className="w-6 h-6 text-emerald-400" />}
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-zinc-900 dark:text-white truncate">
                  {isLoggedIn ? userEmail : 'Guest User'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {isLoggedIn ? 'Sync enabled across devices' : 'History stored ephemerally'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-white/10 flex items-center gap-2">
            {!isLoggedIn ? (
              <button
                onClick={onOpenAuthModal}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-400 to-cyan-500 text-zinc-950 hover:brightness-105 transition shadow-sm cursor-pointer"
              >
                Sign in or Create Account
              </button>
            ) : (
              <div className="w-full text-xs text-zinc-500 flex items-center justify-between">
                <span>Account verified</span>
                <span className="text-emerald-500 font-medium">Free Tier</span>
              </div>
            )}
          </div>
        </div>

        {/* Quota & Token Dashboard */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-wider text-zinc-400">Daily Free Quota</span>
              <span className="text-xs font-mono font-bold text-emerald-500">
                {guestTrials} / 4 Free Downloads Left
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-1">
              <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-[#1e232b] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (guestTrials / 4) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                Audio, thumbnails and MP3 Fast are always <b className="text-emerald-500">100% free & unlimited</b>.
              </p>
            </div>

            {/* Token Counter */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-[#171b21] border border-zinc-200/80 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">High-Speed Tokens</span>
              </div>
              <span className="font-mono font-bold text-sm text-zinc-900 dark:text-white">{tokens} Tokens</span>
            </div>
          </div>

          <div className="pt-4 mt-2">
            <button
              onClick={onOpenTokenModal}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 text-zinc-800 dark:text-zinc-200 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>Earn More Free Tokens (+4)</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3-Tier Subscription Plans */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white font-heading flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span>Membership & Subscription Plans</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Activate premium features directly via WhatsApp support with instant setup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Plan 1: Free Tier */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Starter</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  Current
                </span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white font-heading">Free</h3>
                <p className="text-xs text-zinc-500">$0 / forever</p>
              </div>

              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>4 full video downloads per day</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Max 15-minute video duration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Up to 60-second video clip trimmer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Standard 720p & 1080p quality</span>
                </li>
              </ul>
            </div>

            <button
              disabled
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed text-center"
            >
              Default Plan Active
            </button>
          </div>

          {/* Plan 2: Pro Tier */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#12151a] border border-cyan-500/30 flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-500 font-mono">Popular</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  Pro Speed
                </span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white font-heading">Pro Pass</h3>
                <p className="text-xs text-cyan-500/80 font-medium">High-speed unthrottled</p>
              </div>

              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span><b>Unlimited</b> video downloads daily</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Videos up to 60 minutes long</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Up to 5-minute custom clips</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Zero queue wait times</span>
                </li>
              </ul>
            </div>

            <a
              href={getWhatsAppUrl('Pro Pass')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Activate via WhatsApp</span>
            </a>
          </div>

          {/* Plan 3: Gold Premium Plan (Crown Badge & Glow) */}
          <div className="rounded-2xl p-5 bg-gradient-to-b from-[#1c1608] to-[#12151a] border-2 border-amber-500/60 shadow-[0_0_30px_-8px_rgba(245,158,11,0.35)] flex flex-col justify-between space-y-4 relative">
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-md">
                👑 Gold VIP
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">Exclusive</span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-amber-300 font-heading flex items-center gap-1.5">
                  <span>Gold Premium</span>
                  <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                </h3>
                <p className="text-xs text-amber-400/80 font-medium">Ultimate power & VIP privileges</p>
              </div>

              <ul className="space-y-2 text-xs text-zinc-200 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 font-bold" />
                  <span><b>Exclusive Gold Profile Badge & VIP glow</b></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span><b>4K & 8K Ultra HD</b> direct downloads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span><b>Unlimited</b> video duration (movies & podcasts)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Unlimited length Media Clip trimming</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Dedicated priority server pipeline</span>
                </li>
              </ul>
            </div>

            <a
              href={getWhatsAppUrl('Gold Premium VIP')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-zinc-950 transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-zinc-950" />
              <span>Activate via WhatsApp (Instant)</span>
            </a>
          </div>

        </div>
      </div>

      {/* App Preferences & Settings */}
      <div className="rounded-2xl p-5 bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-heading">
          Application Preferences
        </h2>

        {/* Theme Picker */}
        <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-white/5">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Color Theme</div>
            <div className="text-xs text-zinc-500">Toggle between Dark, Light, or System appearance</div>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-[#171b21] border border-zinc-200 dark:border-white/10 text-zinc-500">
            <button
              onClick={() => onThemeChange('light')}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                theme === 'light' ? 'bg-white text-zinc-900 shadow-xs' : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Light</span>
            </button>
            <button
              onClick={() => onThemeChange('dark')}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                theme === 'dark' ? 'bg-zinc-800 text-zinc-100 shadow-xs' : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dark</span>
            </button>
            <button
              onClick={() => onThemeChange('system')}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                theme === 'system' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">System</span>
            </button>
          </div>
        </div>

        {/* Buy Me a Coffee Support */}
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Support the Project</div>
            <div className="text-xs text-zinc-500">Keep servers running fast & free for everyone worldwide</div>
          </div>
          <a
            href="#donate"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/25 transition"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Buy Us a Coffee</span>
          </a>
        </div>
      </div>

      {/* Accordions: Platforms, Native Apps & FAQ */}
      <div className="rounded-2xl bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 divide-y divide-zinc-100 dark:divide-white/5 overflow-hidden">
        
        {/* Supported Platforms Accordion */}
        <div>
          <button
            onClick={() => toggleSection('platforms')}
            className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" />
              Supported Media Platforms
            </span>
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${openSection === 'platforms' ? 'rotate-180' : ''}`} />
          </button>
          {openSection === 'platforms' && (
            <div className="px-5 pb-5 pt-1 text-xs text-zinc-500 space-y-3">
              <p>A2Z Downloader supports public extraction and direct stream resolution from over 10 major media networks:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                {['YouTube & Shorts', 'TikTok & Sounds', 'Instagram Reels & Stories', 'Facebook Videos', 'Twitter / X', 'Twitch Clips', 'Reddit Videos', 'TeraBox Cloud', 'ShareBox Cloud'].map(plat => (
                  <div key={plat} className="p-2.5 rounded-lg bg-zinc-50 dark:bg-[#171b21] border border-zinc-200 dark:border-white/5 text-zinc-700 dark:text-zinc-300 text-center font-medium">
                    {plat}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Download Native Apps Accordion */}
        <div>
          <button
            onClick={() => toggleSection('apps')}
            className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              Get Standalone App (Windows & Android)
            </span>
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${openSection === 'apps' ? 'rotate-180' : ''}`} />
          </button>
          {openSection === 'apps' && (
            <div className="px-5 pb-5 pt-1 text-xs text-zinc-500 space-y-3">
              <p>Enjoy faster downloads, desktop notifications, and zero browser tab clutter with our standalone builds:</p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={onOpenAppModal}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-xs"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Download Windows (.exe)</span>
                </button>
                <button
                  onClick={onOpenAppModal}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-xs"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Download Android (.apk)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FAQ Accordion */}
        <div>
          <button
            onClick={() => toggleSection('legal')}
            className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              Frequently Asked Questions & Privacy
            </span>
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${openSection === 'legal' ? 'rotate-180' : ''}`} />
          </button>
          {openSection === 'legal' && (
            <div className="px-5 pb-5 pt-1 space-y-3 divide-y divide-zinc-100 dark:divide-white/5 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="pt-2">
                <b className="text-zinc-900 dark:text-white block mb-1">Does A2Z Downloader store my links or downloaded files?</b>
                <p>No. Links and file streams are processed ephemerally on-the-fly. Zero files are permanently kept on our servers.</p>
              </div>
              <div className="pt-2">
                <b className="text-zinc-900 dark:text-white block mb-1">How does WhatsApp Subscription Activation work?</b>
                <p>Clicking the WhatsApp button directly messages our automated 24/7 support line. You send your account email, receive payment info (eSewa, Khalti, or Cards), and your Pro or Gold badge is instantly unlocked.</p>
              </div>
              <div className="pt-2">
                <b className="text-zinc-900 dark:text-white block mb-1">What formats are supported for extraction?</b>
                <p>We support MP4 video up to 4K/8K, WebM, MP3 audio at 320kbps Studio HD, MKV, and animated GIF clipping.</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
