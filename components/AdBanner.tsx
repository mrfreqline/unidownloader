'use client'

import { useState, useEffect } from 'react'

interface AdBannerProps {
  slot?: 'top' | 'middle' | 'bottom'
  className?: string
  format?: 'responsive' | 'mobile_only' | 'desktop_only'
}

const DESKTOP_728x90_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: transparent; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 90px; }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '27a8ecf81421064575013b23579bc8dd',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://www.highrevenueformat.com/27a8ecf81421064575013b23579bc8dd/invoke.js"></script>
</body>
</html>`

const MOBILE_320x50_HTML = `<!DOCTYPE html>
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

export default function AdBanner({ slot = 'middle', className = '', format = 'responsive' }: AdBannerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`w-full max-w-4xl mx-auto my-3 text-center ${className}`}>
        <span className="text-[9px] font-mono tracking-widest text-zinc-400 dark:text-zinc-600 uppercase block mb-1">
          ADVERTISEMENT
        </span>
        <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-100/40 dark:bg-zinc-900/30 h-[66px] sm:h-[106px] animate-pulse" />
      </div>
    )
  }

  return (
    <div className={`w-full max-w-4xl mx-auto my-3 text-center ${className}`}>
      {/* Sleek Subtitle Label (Matches your screenshot) */}
      <span className="text-[9px] font-mono tracking-widest text-zinc-400 dark:text-zinc-500 uppercase block mb-1.5">
        ADVERTISEMENT
      </span>

      {/* Styled Dark Rounded Frame (Matches your screenshot) */}
      <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-2 sm:p-2.5 flex items-center justify-center overflow-hidden shadow-xs transition hover:border-zinc-300 dark:hover:border-zinc-700">
        
        {/* Desktop 728x90 Leaderboard (Hidden on small mobile screens) */}
        {format !== 'mobile_only' && (
          <div className="hidden sm:flex justify-center items-center w-full min-h-[90px]">
            <iframe
              srcDoc={DESKTOP_728x90_HTML}
              width={728}
              height={90}
              title={`Adsterra Desktop ${slot}`}
              className="border-0 overflow-hidden max-w-full"
              loading="eager"
              scrolling="no"
            />
          </div>
        )}

        {/* Mobile 320x50 Banner (Shown only on small mobile screens) */}
        {format !== 'desktop_only' && (
          <div className="flex sm:hidden justify-center items-center w-full min-h-[50px]">
            <iframe
              srcDoc={MOBILE_320x50_HTML}
              width={320}
              height={50}
              title={`Adsterra Mobile ${slot}`}
              className="border-0 overflow-hidden max-w-full"
              loading="eager"
              scrolling="no"
            />
          </div>
        )}

      </div>
    </div>
  )
}
