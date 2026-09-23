'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Coins,
  Tv,
  CheckCircle2,
  Sparkles,
  Lock,
  ArrowRight,
  Clock,
  Music,
  Image as ImageIcon,
  Film,
  Zap,
  SkipForward,
  ExternalLink,
  Info,
} from 'lucide-react'

import AdBanner from './AdBanner'

const ADSTERRA_SMARTLINK = '' // ads removed


interface TokenModalProps {
  isOpen: boolean
  onClose: () => void
  tokens: number
  guestDownloadsLeft: number
  onAddTokens: (amount: number) => void
  isLoggedIn: boolean
  onOpenAuth: () => void
}

const SAMPLE_ADS = [
  {
    sponsor: 'Adsterra Network / Google Ads',
    title: 'High-Performance Cloud Compute & VPS',
    description: 'Deploy lightning-fast NVMe instances starting at $3.50/mo with 99.99% uptime SLA.',
    domain: 'cloudservers.io',
    url: 'https://cloudservers.io',
    tag: 'Cloud Infrastructure',
  },
  {
    sponsor: 'Adsterra Network / Google Ads',
    title: 'Ultra-Fast WireGuard VPN & Privacy Shield',
    description: 'Protect your downloads with 10Gbps unthrottled zero-log encryption worldwide.',
    domain: 'speedshield.net',
    url: 'https://speedshield.net',
    tag: 'Security & Privacy',
  },
]

export default function TokenModal({
  isOpen,
  onClose,
  tokens,
  guestDownloadsLeft,
  onAddTokens,
  isLoggedIn,
  onOpenAuth,
}: TokenModalProps) {
  const [isWatchingAd, setIsWatchingAd] = useState(false)
  const [adProgress, setAdProgress] = useState(0)
  const [adSecondsLeft, setAdSecondsLeft] = useState(5)
  const [canSkip, setCanSkip] = useState(false)
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [rewardClaimed, setRewardClaimed] = useState<number | null>(null)
  const [dailyClaimed, setDailyClaimed] = useState(false)

  useEffect(() => {
    const lastClaim = localStorage.getItem('unidownloader_daily_claim')
    const today = new Date().toISOString().slice(0, 10)
    if (lastClaim === today) {
      setDailyClaimed(true)
    }
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isWatchingAd) {
      if (adSecondsLeft > 0) {
        timer = setTimeout(() => {
          setAdSecondsLeft(prev => prev - 1)
          setAdProgress(prev => Math.min(100, prev + 20))
        }, 1000)
      } else {
        setCanSkip(true)
      }
    }
    return () => clearTimeout(timer)
  }, [isWatchingAd, adSecondsLeft])

  if (!isOpen) return null

  const handleStartAd = () => {
    setIsWatchingAd(true)
    setAdProgress(0)
    setAdSecondsLeft(5)
    setCanSkip(false)
  }

  const handleClaimAndSkip = async () => {
    if (!canSkip) return
    setIsWatchingAd(false)
    setCanSkip(false)

    // Sync token reward to server IP-quota
    try {
      await fetch('/api/user/ip-quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reward', amount: 4 }),
      })
    } catch {
      // Continue even if network error
    }

    onAddTokens(4)
    setRewardClaimed(4)
    setTimeout(() => setRewardClaimed(null), 3500)
  }

  const handleDailyBonus = () => {
    if (dailyClaimed) return
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem('unidownloader_daily_claim', today)
    setDailyClaimed(true)
    onAddTokens(5)
    setRewardClaimed(5)
    setTimeout(() => setRewardClaimed(null), 3000)
  }

  const currentAd = SAMPLE_ADS[currentAdIndex]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90dvh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Tokens & Media Credits
              </h2>
              <p className="text-[11px] text-zinc-500">Collect tokens to unlock high-res downloads</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isWatchingAd && !canSkip) {
                if (confirm('An ad is playing. Leaving now forfeits your +4 tokens. Close anyway?')) {
                  setIsWatchingAd(false)
                  onClose()
                }
              } else {
                onClose()
              }
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition touch-manipulation cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Scrollable with safe bottom padding */}
        <div className="p-3.5 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto overscroll-contain flex-1">
          
          {/* Reward Alert Message */}
          {rewardClaimed && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Successfully claimed <strong>+{rewardClaimed} Tokens</strong>! Credited to your balance.</span>
            </div>
          )}

          {/* Current Balance Bar: 2 columns on mobile */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] sm:text-[11px] text-zinc-500 font-medium uppercase tracking-wider block">
                Token Balance
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {tokens}
                </span>
                <span className="text-[11px] text-amber-500 font-medium">Credits</span>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] sm:text-[11px] text-zinc-500 font-medium uppercase tracking-wider block">
                Free Downloads
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {guestDownloadsLeft}
                </span>
                <span className="text-[11px] text-zinc-400">of 3 remaining</span>
              </div>
            </div>
          </div>

          {/* SPONSORED AD CONTAINER */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Watch Sponsored Ad
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                +4 Tokens / ad
              </span>
            </div>

            {isWatchingAd ? (
              <div className="space-y-3 rounded-xl bg-zinc-950 border border-zinc-800 p-3 sm:p-4 text-white shadow-inner">
                
                {/* Top Ad Status Bar */}
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-1 text-zinc-400 truncate max-w-[170px]">
                    <Info className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span className="truncate">{currentAd.sponsor}</span>
                  </div>

                  {canSkip ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 animate-pulse shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Ready to Skip
                    </span>
                  ) : (
                    <span className="text-amber-400 shrink-0">
                      Skip in {adSecondsLeft}s
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${adProgress}%` }}
                  />
                </div>

                {/* AD DISPLAY SLOT */}
                <div className="space-y-2">
                  <div
                    id="adsterra-banner-slot"
                    className="relative rounded-xl bg-zinc-900 border border-zinc-800 p-2 sm:p-3 text-center"
                  >
                    <AdBanner format="mobile_only" className="my-0" />
                  </div>
                </div>

                {/* Bottom Skip / Claim Control: full width on mobile for one-thumb tap */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-zinc-400 text-center sm:text-left">
                    {canSkip
                      ? 'Ad viewed for 5s. Tap below to claim:'
                      : 'Ad remains active until you tap skip.'}
                  </span>

                  {canSkip ? (
                    <button
                      onClick={handleClaimAndSkip}
                      className="w-full sm:w-auto py-2.5 px-4 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation min-h-[42px]"
                    >
                      <span>Skip Ad & Claim +4</span>
                      <SkipForward className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full sm:w-auto py-2.5 px-4 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-500 opacity-60 cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[42px]"
                    >
                      <span>Skip in {adSecondsLeft}s</span>
                      <Clock className="w-3 h-3" />
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <p className="text-[11px] sm:text-xs text-zinc-500 leading-relaxed">
                  Watch a 5-second sponsor ad. The ad will stay on screen until you tap skip to receive your tokens.
                </p>
                <button
                  onClick={handleStartAd}
                  className="w-full sm:w-auto shrink-0 py-2.5 px-4 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[42px]"
                >
                  <Tv className="w-3.5 h-3.5" />
                  Watch Ad (+4)
                </button>
              </div>
            )}
          </div>

          {/* Daily Drop */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                  Daily Token Drop
                </span>
                <span className="text-[10px] sm:text-[11px] text-zinc-500">
                  {dailyClaimed ? 'Claimed for today.' : 'Free reload of +5 tokens'}
                </span>
              </div>
            </div>

            <button
              onClick={handleDailyBonus}
              disabled={dailyClaimed}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:pointer-events-none transition text-zinc-800 dark:text-zinc-200 cursor-pointer touch-manipulation shrink-0 min-h-[36px]"
            >
              {dailyClaimed ? 'Claimed' : 'Claim +5'}
            </button>
          </div>

          {/* Pricing Rules */}
          <div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block mb-2">
              Token Consumption Rules
            </span>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              <div className="p-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Music className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  Audio Downloads
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  FREE (Unlimited)
                </span>
              </div>

              <div className="p-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <ImageIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  Thumbnails & Covers
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  FREE (Unlimited)
                </span>
              </div>

              <div className="p-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Film className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  Standard (360p - 720p)
                </span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300 text-[11px]">
                  2 Tokens / Free Trial
                </span>
              </div>

              <div className="p-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Film className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  Full HD (1080p)
                </span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">
                  5 Tokens
                </span>
              </div>

              <div className="p-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Ultra HD (4K)
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 text-[11px]">
                  <Lock className="w-3 h-3 inline" /> 10T (Login)
                </span>
              </div>
            </div>
          </div>

          {/* Account Save Prompt */}
          {!isLoggedIn && (
            <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <span className="font-medium text-zinc-900 dark:text-zinc-100 block text-xs">
                  Save tokens permanently
                </span>
                <span className="text-zinc-500 text-[10px] sm:text-[11px] block">
                  Log in so tokens never get wiped.
                </span>
              </div>
              <button
                onClick={() => {
                  onClose()
                  onOpenAuth()
                }}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition cursor-pointer touch-manipulation min-h-[36px]"
              >
                Sign in
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
