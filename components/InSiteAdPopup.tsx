'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

// Adsterra 320x50 Banner — passive display, no redirect
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

export default function InSiteAdPopup() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show 2 seconds after page load — not intrusive, user has had time to see the page
    const t = setTimeout(() => setIsVisible(true), 2000)
    return () => clearTimeout(t)
  }, [])

  if (!isVisible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-2 px-3 py-2
                 bg-zinc-950/95 border-t border-zinc-800 shadow-2xl
                 animate-in slide-in-from-bottom duration-300"
      role="complementary"
      aria-label="Sponsor advertisement"
    >
      {/* 320×50 Adsterra banner — passive, no page redirect */}
      <iframe
        srcDoc={ADSTERRA_320x50_HTML}
        width={320}
        height={50}
        title="Sponsor"
        className="border-0 overflow-hidden shrink-0"
        scrolling="no"
      />

      {/* Dismiss button — users can close instantly */}
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition cursor-pointer shrink-0"
        aria-label="Close advertisement"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
