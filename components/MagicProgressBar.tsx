'use client'

import React, { useEffect, useState } from 'react'

interface MagicProgressBarProps {
  isActive: boolean
  mode?: 'analyzing' | 'downloading'
  customMessage?: string
}

export default function MagicProgressBar({
  isActive,
  mode = 'analyzing',
  customMessage,
}: MagicProgressBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isActive) {
      setProgress(0)
      return
    }

    // Start with a quick bump to 8%
    setProgress(8)

    // Smooth progressive increments
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95 // Hold at 95% until complete
        // Fast at start, steady in middle, slower near end
        const increment = prev < 30 ? 4 : prev < 60 ? 3 : prev < 85 ? 2 : 1
        return Math.min(prev + increment, 95)
      })
    }, 150)

    return () => clearInterval(interval)
  }, [isActive])

  if (!isActive) return null

  const getSubtext = () => {
    if (customMessage) return customMessage
    if (mode === 'analyzing') {
      if (progress < 25) return 'Connecting to media server...'
      if (progress < 60) return 'Extracting video formats & audio tracks...'
      if (progress < 85) return 'Resolving high-speed Cloudflare CDN streams...'
      return 'Finishing stream analysis...'
    } else {
      if (progress < 25) return 'Requesting high-speed media stream...'
      if (progress < 60) return 'Preparing media attachment...'
      if (progress < 85) return 'Starting gigabit browser download...'
      return 'Transferring file to your device...'
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto py-3 px-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 shadow-sm animate-in fade-in-50 zoom-in-95 duration-200 space-y-2">
      {/* Header Text matching reference image */}
      <div className="text-center">
        <p className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400 font-sans tracking-wide">
          Doing the magic, please wait...{progress}%
        </p>
      </div>

      {/* Pill Progress Bar matching reference image */}
      <div className="w-full h-3.5 sm:h-4 bg-sky-100 dark:bg-zinc-800 rounded-full p-0.5 overflow-hidden shadow-inner flex items-center">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-blue-600 transition-all duration-200 ease-out shadow-sm"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Subtext indicator */}
      <div className="text-center">
        <p className="text-[10px] sm:text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
          {getSubtext()}
        </p>
      </div>
    </div>
  )
}
