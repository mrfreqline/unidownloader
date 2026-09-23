'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

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

interface InSiteAdPopupProps {
  /** Pass true only after a successful media analysis so the bar never shows on first visit */
  show?: boolean
}

export default function InSiteAdPopup({ show = false }: InSiteAdPopupProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!show) return
    // Slide up 800ms after the download button appears (feels natural, not intrusive)
    const t = setTimeout(() => setIsVisible(true), 800)
    return () => clearTimeout(t)
  }, [show])

  if (!isVisible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-2 px-3 py-1.5
                 bg-zinc-950/95 border-t border-zinc-800 shadow-lg
                 animate-in slide-in-from-bottom duration-300"
      role="complementary"
      aria-label="Sponsor ad"
    >
      {/* 320×50 iframe — passive display, no redirect */}
      <iframe
        srcDoc={ADSTERRA_320x50_HTML}
        width={320}
        height={50}
        title="Sponsor"
        className="border-0 overflow-hidden shrink-0"
        scrolling="no"
        sandbox="allow-scripts allow-same-origin"
      />

      {/* Close button — users can dismiss instantly, no countdown */}
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer shrink-0"
        aria-label="Close ad"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
