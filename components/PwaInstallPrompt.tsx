'use client'

import { useState, useEffect } from 'react'
import { Download, X, Share, Smartphone } from 'lucide-react'

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    // Check if already running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isStandalone) return

    // Check if dismissed in this session
    if (sessionStorage.getItem('pwa_prompt_dismissed') === 'true') return

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(ua)
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua)

    if (isIosDevice && isSafari) {
      setIsIos(true)
      const timer = setTimeout(() => setShowPrompt(true), 3500)
      return () => clearTimeout(timer)
    }

    // Android & Desktop Chrome/Edge beforeinstallprompt listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true)
      return
    }

    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setShowIosGuide(false)
    try {
      sessionStorage.setItem('pwa_prompt_dismissed', 'true')
    } catch {}
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-2xl border border-emerald-500/30 bg-zinc-950/95 backdrop-blur-md p-3.5 sm:p-4 shadow-2xl text-zinc-100 flex flex-col gap-2.5">
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black ring-1 ring-emerald-500/30 shrink-0">
              <img src="/logo-icon.jpg" alt="A2Z App" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <span>Install A2Z App</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-400 font-semibold">
                  Free
                </span>
              </h4>
              <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                Faster downloads & instant 1-tap home screen access.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS Step-by-Step Mini Guide */}
        {showIosGuide && (
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 space-y-1 animate-in fade-in-50">
            <p className="font-semibold text-emerald-400 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" /> To Install on iPhone / iPad:
            </p>
            <p className="flex items-center gap-1 text-zinc-400">
              1. Tap the <Share className="w-3.5 h-3.5 inline text-blue-400 mx-0.5" /> <strong>Share</strong> icon in Safari.
            </p>
            <p className="text-zinc-400">
              2. Scroll down and tap <strong>Add to Home Screen (+)</strong>.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isIos ? 'Show Install Guide' : 'Install App'}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition cursor-pointer border border-zinc-800"
          >
            Later
          </button>
        </div>

      </div>
    </div>
  )
}
