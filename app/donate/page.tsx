'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import DonationSection from '@/components/DonationSection'
import {
  Coffee,
  Heart,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Sparkles,
  Server,
  Layers,
  Code2,
} from 'lucide-react'

export default function DonatePage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('unidownloader_theme') as 'light' | 'dark' | 'system' | null
    if (saved) {
      setTheme(saved)
    }
  }, [])

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    setTheme(t)
    localStorage.setItem('unidownloader_theme', t)
    const root = document.documentElement
    if (t === 'dark') {
      root.classList.add('dark')
    } else if (t === 'light') {
      root.classList.remove('dark')
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#090b0e] text-zinc-900 dark:text-[#eef1f4] flex flex-col font-sans selection:bg-emerald-500/25 selection:text-emerald-800 dark:selection:text-emerald-300 transition-colors duration-200">
      
      {/* Top Navbar */}
      <Navbar theme={theme} onThemeChange={applyTheme} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 w-full space-y-10">
        
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 group shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Downloader</span>
          </Link>
        </div>

        {/* Hero Banner */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-xs">
            <Coffee className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
            <span>Buy Us a Coffee • Support Server Infrastructure</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Help Us Keep <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">A2Z Downloader</span> Free & Ad-Light
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            We provide fast, ephemeral, zero-log video and audio conversion with no paywalls.
            Your support covers bandwidth, GPU transcoding machines, and domain renewals so everyone can download freely.
          </p>
        </section>

        {/* What your donation funds */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Cloud Bandwidth</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Powering gigabit streaming buffers and instant stream forwarding across 35+ platforms.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Transcoding Engines</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              320kbps MP3 audio extractors, container conversion (MP4/MKV/WebM), and video trimming servers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Continuous Updates</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Keeping extractors up to date when social media platforms change their algorithms and APIs.
            </p>
          </div>
        </div>

        {/* Direct Donation Component */}
        <DonationSection variant="full" />

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-white/10 py-6 text-center text-xs text-zinc-500 dark:text-zinc-500 mt-10">
        <p>© {new Date().getFullYear()} A2Z Downloader. Built with ❤️ for universal media access.</p>
      </footer>
    </div>
  )
}
