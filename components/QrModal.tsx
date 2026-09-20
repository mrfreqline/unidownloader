'use client'

import { useState } from 'react'
import { X, QrCode, Smartphone, Copy, Check, ExternalLink } from 'lucide-react'

interface QrModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title?: string
}

export default function QrModal({ isOpen, onClose, url, title }: QrModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  // Ensure full URL for phone scanning
  let scanUrl = url
  if (scanUrl.startsWith('/')) {
    if (typeof window !== 'undefined') {
      scanUrl = `${window.location.origin}${scanUrl}`
    }
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
    scanUrl
  )}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scanUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 text-center space-y-4 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Send to Phone</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title Hint */}
        {title && (
          <p className="text-xs text-zinc-400 font-medium line-clamp-1">
            {title}
          </p>
        )}

        {/* High-Contrast QR Code Card */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white shadow-inner mx-auto w-fit">
          <img
            src={qrImageUrl}
            alt="Scan QR code to open on phone"
            className="w-48 h-48 object-contain rounded-md"
            loading="eager"
          />
        </div>

        {/* Instructions */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scan with your phone camera</span>
          </p>
          <p className="text-[11px] text-zinc-500">
            Open camera on iPhone or Android to download this media directly on your phone.
          </p>
        </div>

        {/* Copy Link / Open Tab */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium border border-zinc-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <a
            href={scanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open</span>
          </a>
        </div>

      </div>
    </div>
  )
}
