'use client'

import Link from 'next/link'
import {
  Download,
  Coins,
  Music,
  Image as ImageIcon,
  Film,
  Zap,
  Tv,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

export default function Pricing() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950">
              <Download className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              UniDownloader
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
          >
            Back to Downloader
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Coins className="w-3 h-3" />
            Zero Subscription Model • Fair-Use Tokens
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Free Community Media Credits
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-xl mx-auto leading-relaxed">
            UniDownloader does not lock you into recurring credit card subscriptions. Audio and thumbnails are completely free forever, and video credits can be earned by supporting infrastructure sponsors.
          </p>
        </div>

        {/* Rate Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Audio & Image Card */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider font-mono text-emerald-600 dark:text-emerald-400 block">
                Zero Cost
              </span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                Audio & Covers
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Extract high-bitrate MP3 / WAV audio and original full-res cover images with zero restrictions.
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Unlimited MP3 320kbps</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Lossless Source Images</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>No Account Required</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-100">
                0 Tokens
              </span>
              <span className="text-xs text-zinc-500 block">Forever Free</span>
            </div>
          </div>

          {/* Standard & Full HD Card */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider font-mono text-zinc-500 block">
                Standard & Full HD
              </span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                720p / 1080p Video
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Crisp H.264 MP4 streams with merged stereo tracks. Includes 3 free out-of-the-box guest downloads.
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>3 Free Guest Trials</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>1080p: 5 Tokens / download</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>720p: 2 Tokens / download</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-100">
                2 - 5 Tokens
              </span>
              <span className="text-xs text-zinc-500 block">Earnable via short ads</span>
            </div>
          </div>

          {/* 4K Ultra HD Card */}
          <div className="p-5 rounded-2xl border border-amber-500/30 bg-white dark:bg-zinc-900/60 space-y-4 shadow-xs relative">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider font-mono text-amber-600 dark:text-amber-400 block">
                Ultra High Definition
              </span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                4K UHD (2160p)
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Maximum resolution master streams. Heavy compute muxing gated behind verified login.
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Full 4K Raw Resolution</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Account Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Saved to Permanent Ledger</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">
                10 Tokens
              </span>
              <span className="text-xs text-zinc-500 block">Deducted from registered account</span>
            </div>
          </div>

        </div>

        {/* How to Earn Tokens */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              How to Collect Free Media Tokens
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-zinc-500" />
                  Watch Sponsored Ad
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  +4 Tokens
                </span>
              </div>
              <p className="text-zinc-500 leading-relaxed">
                Watch a 5-second developer sponsor snippet directly in the app. Tokens credit instantly to your local and cloud balance.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  Daily Community Drop
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  +5 Tokens
                </span>
              </div>
              <p className="text-zinc-500 leading-relaxed">
                Log in or open the token modal once every 24 hours to claim a reload of 5 free tokens.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs"
          >
            Start Downloading Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </main>
  )
}