'use client'

import { Sparkles, ArrowRight } from 'lucide-react'

interface AdBannerProps {
  slot?: 'top' | 'middle' | 'bottom'
  className?: string
}

export default function AdBanner({ slot = 'middle', className = '' }: AdBannerProps) {
  return (
    <div className={`w-full max-w-4xl mx-auto my-2 ${className}`}>
      {/* Compact Ad Banner */}
      <div className="relative rounded-xl border border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-100/50 dark:bg-zinc-900/30 px-3 py-2 flex items-center justify-between gap-2.5 transition shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700">
        
        {/* Left: Micro Tag + Compact Title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[8px] font-mono uppercase tracking-wider px-1 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500 shrink-0">
            Ad
          </span>

          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[11px] sm:text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
              {slot === 'top'
                ? 'High-speed media extraction • 100% Free & Unlimited'
                : slot === 'bottom'
                ? 'Anonymous & Ephemeral CDN • Zero Logs Saved'
                : 'Need 4K UHD or MP3? Download in maximum bitrate'}
            </span>
          </div>
        </div>

        {/* Right: Small Action Button */}
        <button
          onClick={() => {
            const el = document.querySelector('input[type="url"]') as HTMLInputElement
            if (el) {
              el.focus()
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-[10px] sm:text-[11px] font-semibold transition shrink-0 cursor-pointer shadow-xs"
        >
          <span>Fast Download</span>
          <ArrowRight className="w-3 h-3" />
        </button>

      </div>
    </div>
  )
}
