'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink, Sparkles } from 'lucide-react'

const ADSTERRA_320x50_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: transparent; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 50px; }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '477de950be79cc139758854342f5b52d',
      'format' : 'iframe',
      'height' : 50,
      'width' : 320,
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://www.highrevenueformat.com/477de950be79cc139758854342f5b52d/invoke.js"></script>
</body>
</html>`

const SMARTLINK =
  'https://www.profitableratecpmnetwork.com/gvwaq8hih?key=3a220d2a7e229bd864d3aac504d1e304'

export default function InSiteAdPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState(5)

  useEffect(() => {
    // Show after 1.2s on first load
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 1200)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    if (timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, timeLeft])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-[360px] rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-4 text-center space-y-3 animate-in zoom-in-95 duration-150">
        
        {/* Top Header with easy crossable button */}
        <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] tracking-wider uppercase font-semibold">Special Sponsor</span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer touch-manipulation"
            aria-label="Close Ad"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Small In-Site Ad Frame (No screen redirect) */}
        <div className="py-2 flex items-center justify-center bg-zinc-900/50 rounded-xl border border-zinc-800/50 min-h-[60px] overflow-hidden">
          <iframe
            srcDoc={ADSTERRA_320x50_HTML}
            width={320}
            height={50}
            title="In-Site Sponsor Ad"
            className="border-0 overflow-hidden max-w-full"
            scrolling="no"
          />
        </div>

        {/* Visit Sponsor Optional Button */}
        <a
          href={SMARTLINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium py-1 transition"
        >
          <span>Explore Sponsor Deals</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {/* Easy Crossable / Auto Countdown Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <span>✕ Close & Continue</span>
          {timeLeft > 0 && (
            <span className="text-[10px] font-mono bg-zinc-900 px-1.5 py-0.5 rounded-md text-amber-400">
              {timeLeft}s
            </span>
          )}
        </button>

      </div>
    </div>
  )
}
