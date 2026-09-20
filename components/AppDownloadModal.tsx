'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Smartphone,
  Monitor,
  Download,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Share,
  PlusSquare,
  QrCode,
} from 'lucide-react'

interface AppDownloadModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const [platform, setPlatform] = useState<'android' | 'windows' | 'ios'>('android')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showCopied, setShowCopied] = useState(false)

  useEffect(() => {
    // Detect user device OS
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase()
      if (/iphone|ipad|ipod/.test(ua)) {
        setPlatform('ios')
      } else if (/windows|win32|win64/.test(ua)) {
        setPlatform('windows')
      } else if (/android/.test(ua)) {
        setPlatform('android')
      }

      // Check if running in standalone mode (already installed)
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      ) {
        setIsInstalled(true)
      }

      const handleBeforeInstall = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstall)
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      }
    }
  }, [])

  if (!isOpen) return null

  const handleInstallAndroid = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === 'accepted') {
          setIsInstalled(true)
        }
        setDeferredPrompt(null)
      } catch (err) {
        console.warn('Install prompt error:', err)
      }
    } else {
      alert(
        'To install on Android:\n1. Tap your browser menu (⋮) in Chrome.\n2. Tap "Install App" or "Add to Home Screen".'
      )
    }
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Get A2Z Downloader App
            </h2>
            <p className="text-xs text-zinc-500">
              Install native standalone app for Phone & PC • 100% Free
            </p>
          </div>
        </div>

        {/* Platform Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setPlatform('android')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              platform === 'android'
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>Android APK</span>
          </button>
          <button
            type="button"
            onClick={() => setPlatform('windows')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              platform === 'windows'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 shrink-0" />
            <span>Windows .EXE</span>
          </button>
          <button
            type="button"
            onClick={() => setPlatform('ios')}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              platform === 'ios'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>iPhone / iOS</span>
          </button>
        </div>

        {/* Tab 1: Android Platform */}
        {platform === 'android' && (
          <div className="space-y-3 pt-1 animate-in fade-in-50 duration-200">
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Android Phone App (.apk)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  Ready to Install
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Install directly on your Android phone as a native app with app icon, high-speed downloads, and full-screen experience.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleInstallAndroid}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer touch-manipulation"
              >
                <Zap className="w-4 h-4 stroke-[2.5]" />
                <span>{isInstalled ? 'App Already Installed' : '1-Tap Direct Install on Phone (WebAPK)'}</span>
              </button>

              <a
                href="/apps/A2Z-Downloader.apk"
                download="A2Z-Downloader.apk"
                className="w-full py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer touch-manipulation"
              >
                <Download className="w-4 h-4" />
                <span>Download .APK File (Offline Sideload)</span>
              </a>

              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs space-y-1.5">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                  Quick Install Tip:
                </span>
                <p className="text-zinc-500 text-[11px] leading-relaxed">
                  For the fastest install with zero warnings, tap <strong>1-Tap Direct Install</strong> above or open Chrome menu (⋮) ➔ <strong>"Install app"</strong>. Android sets it up immediately!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Windows Platform (.EXE) */}
        {platform === 'windows' && (
          <div className="space-y-3 pt-1 animate-in fade-in-50 duration-200">
            <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-blue-500" />
                  Windows Desktop Application (.exe)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  Ready to Run
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Run A2Z Downloader directly from your Windows taskbar or desktop without keeping browser tabs open.
              </p>
            </div>

            <div className="space-y-2">
              <a
                href="/apps/A2Z-Downloader-Setup.exe"
                download="A2Z-Downloader-Setup.exe"
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer touch-manipulation"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download .EXE Setup File for Windows</span>
              </a>

              <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs space-y-2">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                  Installation & Uninstallation Features:
                </span>
                <ul className="list-disc list-inside text-zinc-500 space-y-1 text-[11px] leading-relaxed">
                  <li><strong>Customizable Setup:</strong> Option to choose desktop icon, Start Menu entry, and auto-launch.</li>
                  <li><strong>Native Standalone App:</strong> Runs in dedicated window without browser tabs or borders.</li>
                  <li><strong>Easy 1-Click Uninstall:</strong> Fully registered in Windows <strong>Settings ➔ Apps ➔ Installed apps</strong> and Start Menu. You can cleanly uninstall anytime with 1 click!</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: iOS / iPhone */}
        {platform === 'ios' && (
          <div className="space-y-3 pt-1 animate-in fade-in-50 duration-200">
            <div className="p-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 space-y-2">
              <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 block">
                iPhone & iPad Home Screen App
              </span>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Apple allows you to save A2Z Downloader directly to your iPhone Home Screen via Safari with full-screen experience and offline loading.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs space-y-2.5">
              <div className="flex items-center gap-2.5 text-zinc-800 dark:text-zinc-200">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <span>Open this page in <strong>Safari</strong> on your iPhone.</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-800 dark:text-zinc-200">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <span className="flex items-center gap-1">
                  Tap the <Share className="w-3.5 h-3.5 text-blue-500 inline" /> <strong>Share</strong> icon at the bottom of Safari.
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-800 dark:text-zinc-200">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <span className="flex items-center gap-1">
                  Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-zinc-400 inline" /> <strong>"Add to Home Screen"</strong>.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer: Copy Link & Close */}
        <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <button
            type="button"
            onClick={handleCopyLink}
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer transition font-mono"
          >
            {showCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <QrCode className="w-3.5 h-3.5" />}
            <span>{showCopied ? 'Link Copied!' : 'Copy Web Link'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-semibold text-zinc-900 dark:text-zinc-100 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
