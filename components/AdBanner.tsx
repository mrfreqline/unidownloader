'use client'

import { useEffect, useRef } from 'react'

interface AdBannerProps {
  slot?: 'top' | 'middle' | 'bottom'
  className?: string
  format?: 'responsive' | 'mobile_only' | 'desktop_only'
}

// Adsterra banner keys
const DESKTOP_KEY = '27a8ecf81421064575013b23579bc8dd'
const MOBILE_KEY  = '477de950be79cc139758854342f5b52d'

function AdSlot({ adKey, width, height }: { adKey: string; width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const injected = useRef(false)

  useEffect(() => {
    if (!ref.current || injected.current) return
    injected.current = true

    // Set atOptions then load invoke.js — must be done in this order
    const scriptOptions = document.createElement('script')
    scriptOptions.type = 'text/javascript'
    scriptOptions.text = `
      atOptions = {
        'key': '${adKey}',
        'format': 'iframe',
        'height': ${height},
        'width': ${width},
        'params': {}
      };
    `

    const scriptInvoke = document.createElement('script')
    scriptInvoke.type = 'text/javascript'
    scriptInvoke.src = `//www.highrevenueformat.com/${adKey}/invoke.js`
    scriptInvoke.async = true

    ref.current.appendChild(scriptOptions)
    ref.current.appendChild(scriptInvoke)
  }, [adKey, width, height])

  return (
    <div
      ref={ref}
      style={{ width, height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    />
  )
}

export default function AdBanner({ slot = 'middle', className = '', format = 'responsive' }: AdBannerProps) {
  return (
    <div className={`w-full max-w-4xl mx-auto my-3 text-center ${className}`}>
      <span className="text-[9px] font-mono tracking-widest text-zinc-400 dark:text-zinc-500 uppercase block mb-1.5">
        ADVERTISEMENT
      </span>

      <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-2 sm:p-2.5 flex items-center justify-center overflow-hidden shadow-xs">

        {/* Desktop 728×90 Leaderboard — hidden on mobile */}
        {format !== 'mobile_only' && (
          <div className="hidden sm:flex justify-center items-center w-full min-h-[90px]">
            <AdSlot adKey={DESKTOP_KEY} width={728} height={90} />
          </div>
        )}

        {/* Mobile 320×50 Banner — hidden on desktop */}
        {format !== 'desktop_only' && (
          <div className="flex sm:hidden justify-center items-center w-full min-h-[50px]">
            <AdSlot adKey={MOBILE_KEY} width={320} height={50} />
          </div>
        )}

      </div>
    </div>
  )
}
