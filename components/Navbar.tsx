'use client'

import Link from 'next/link'
import { Download, Coins, Sun, Moon, Monitor, User, LogOut, Plus, Smartphone, Music, Coffee, HelpCircle } from 'lucide-react'

interface NavbarProps {
  tokens: number
  onOpenTokenModal: () => void
  onOpenAuthModal: () => void
  onOpenAppModal?: () => void
  isLoggedIn: boolean
  userEmail?: string
  onLogout?: () => void
  theme: 'light' | 'dark' | 'system'
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void
}

export default function Navbar({
  tokens,
  onOpenTokenModal,
  onOpenAuthModal,
  onOpenAppModal,
  isLoggedIn,
  userEmail,
  onLogout,
  theme,
  onThemeChange,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-xs shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-800 group-hover:scale-105 transition">
              <img
                src="/logo-icon.jpg"
                alt="A2Z Downloader"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-0.5">
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  A2Z
                </span>
                <span>Downloader</span>
              </span>
              <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                Simple & Fast
              </span>
            </div>
          </Link>

          {/* Zero retention tag - hidden on small mobile to save space */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Zero Retention Active
          </div>

          {/* Dedicated Fast MP3 Link */}
          <Link
            href="/mp3"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 transition cursor-pointer"
            title="Dedicated Fast MP3 Downloader"
          >
            <Music className="w-3.5 h-3.5 text-emerald-500" />
            <span>MP3 Fast</span>
          </Link>

          {/* Support / Buy Us a Coffee Link */}
          <a
            href="#donate"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 transition cursor-pointer"
            title="Buy Us a Coffee (eSewa / Khalti / Bank QR)"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-500" />
            <span>Buy Coffee</span>
          </a>

          {/* FAQ Link */}
          <a
            href="/#faq"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition cursor-pointer"
            title="Frequently Asked Questions"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>FAQ</span>
          </a>
        </div>

        {/* Right Actions: Compact & Touch-friendly for Mobile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Token Counter & Earn Button */}
          <button
            onClick={onOpenTokenModal}
            className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition text-zinc-800 dark:text-zinc-200 touch-manipulation cursor-pointer"
            title="Click to earn tokens"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-mono font-bold text-xs">{tokens}</span>
            <span className="text-zinc-400 text-[11px] hidden md:inline">Tokens</span>
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold shrink-0">
              <Plus className="w-2.5 h-2.5" />
            </span>
          </button>

          {/* Install / Download App Button */}
          {onOpenAppModal && (
            <button
              onClick={onOpenAppModal}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition text-emerald-600 dark:text-emerald-400 touch-manipulation cursor-pointer"
              title="Get Windows .exe or Phone APK"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline font-semibold">App</span>
            </button>
          )}

          {/* Theme Selector: Compact segmented toggle */}
          <div className="flex items-center p-0.5 sm:p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500">
            <button
              onClick={() => onThemeChange('light')}
              className={`p-1 sm:p-1.5 rounded-md transition touch-manipulation ${
                theme === 'light'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Light theme"
              aria-label="Light theme"
            >
              <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              onClick={() => onThemeChange('system')}
              className={`p-1 sm:p-1.5 rounded-md transition touch-manipulation hidden xs:inline-block ${
                theme === 'system'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="System theme"
              aria-label="System theme"
            >
              <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              onClick={() => onThemeChange('dark')}
              className={`p-1 sm:p-1.5 rounded-md transition touch-manipulation ${
                theme === 'dark'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Dark theme"
              aria-label="Dark theme"
            >
              <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* User Account / Auth */}
          {isLoggedIn ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-w-[130px] sm:max-w-[200px]">
                <User className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate font-medium">{userEmail || 'Account'}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 sm:p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition touch-manipulation"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs touch-manipulation cursor-pointer shrink-0"
            >
              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Sign in</span>
            </button>
          )}

        </div>
      </div>

      {/* Mobile Quick-Navigation Strip (<sm): Always visible on smartphones */}
      <div className="sm:hidden border-t border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-md px-3 py-1.5 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar text-[11px] font-medium">
        <Link
          href="/mp3"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 transition shrink-0"
        >
          <Music className="w-3 h-3 text-emerald-500" />
          <span>MP3 Fast</span>
        </Link>

        <a
          href="#donate"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 transition shrink-0"
        >
          <Coffee className="w-3 h-3 text-amber-500" />
          <span>Buy Coffee</span>
        </a>

        <a
          href="/#faq"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-200/70 dark:bg-zinc-900 hover:bg-zinc-300/70 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-300/70 dark:border-zinc-800 transition shrink-0"
        >
          <HelpCircle className="w-3 h-3 text-emerald-500" />
          <span>FAQ</span>
        </a>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Zero Retention</span>
        </div>
      </div>
    </header>
  )
}
