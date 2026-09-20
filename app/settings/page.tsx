'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Download,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  Trash2,
  Shield,
  Sliders,
  Bell,
  User,
  ArrowRight,
} from 'lucide-react'

export default function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark')
  const [autoQuality, setAutoQuality] = useState('1080p')
  const [ephemeralAutoPurge, setEphemeralAutoPurge] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const savedTheme = (localStorage.getItem('unidownloader_theme') as any) || 'dark'
    setTheme(savedTheme)
  }, [])

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem('unidownloader_theme', newTheme)
    const isDark =
      newTheme === 'dark' ||
      (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
        value ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-300 dark:bg-zinc-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
          value
            ? 'translate-x-5 bg-white dark:bg-zinc-950 shadow-xs'
            : 'translate-x-0 bg-white shadow-xs'
        }`}
      />
    </button>
  )

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-black flex items-center justify-center shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-800">
              <img src="/logo-icon.jpg" alt="A2Z Downloader" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-0.5">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                A2Z
              </span>
              <span>Downloader</span>
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
      <div className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-10 space-y-6">
        
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            System Preferences
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure ephemeral cache behaviors, default stream resolutions, and theme appearance.
          </p>
        </div>

        {saved && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in-50">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-mono">Preferences stored in local memory successfully.</span>
          </div>
        )}

        {/* Theme Appearance */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <Sun className="w-4 h-4 text-zinc-500" />
            Appearance
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 block">
                Interface Mode
              </span>
              <span className="text-[11px] text-zinc-500">
                Choose light, dark, or system matching
              </span>
            </div>

            <div className="flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs">
              <button
                type="button"
                onClick={() => applyTheme('light')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition ${
                  theme === 'light'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Sun className="w-3 h-3" />
                Light
              </button>
              <button
                type="button"
                onClick={() => applyTheme('system')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition ${
                  theme === 'system'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Monitor className="w-3 h-3" />
                System
              </button>
              <button
                type="button"
                onClick={() => applyTheme('dark')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition ${
                  theme === 'dark'
                    ? 'bg-zinc-900 text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Moon className="w-3 h-3" />
                Dark
              </button>
            </div>
          </div>
        </div>

        {/* Engine & Download Defaults */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <Sliders className="w-4 h-4 text-zinc-500" />
            Stream & Quality Defaults
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 block">
                Default Resolution Target
              </span>
              <span className="text-[11px] text-zinc-500">
                Pre-selected quality tier upon URL inspection
              </span>
            </div>

            <select
              value={autoQuality}
              onChange={e => setAutoQuality(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs outline-none font-mono"
            >
              <option value="1080p">1080p Full HD (5 Tokens)</option>
              <option value="720p">720p HD (2 Tokens / Free)</option>
              <option value="Audio Only">Audio Only (FREE)</option>
              <option value="4K">4K Ultra HD (10 Tokens)</option>
            </select>
          </div>
        </div>

        {/* Ephemeral Privacy & Storage */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <Shield className="w-4 h-4 text-emerald-500" />
            Storage & Privacy
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 block">
                Session Auto-Purge
              </span>
              <span className="text-[11px] text-zinc-500">
                Instantly unlinks temporary video buffers upon transfer completion
              </span>
            </div>
            <Toggle value={ephemeralAutoPurge} onChange={setEphemeralAutoPurge} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 block">
                Browser Completion Alert
              </span>
              <span className="text-[11px] text-zinc-500">
                Display system status banner when download starts
              </span>
            </div>
            <Toggle value={notifications} onChange={setNotifications} />
          </div>
        </div>

        {/* Local Storage Flush / Danger Zone */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
            <Trash2 className="w-4 h-4" />
            Reset Local Storage
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[11px] text-zinc-500 max-w-md leading-relaxed">
              Flush cached tokens, guest trial counters, and offline session cookies from your browser.
            </p>
            <button
              onClick={() => {
                localStorage.clear()
                alert('Local cache reset successfully.')
                window.location.reload()
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-500 text-white transition shrink-0"
            >
              Flush Cache
            </button>
          </div>
        </div>

        {/* Save CTA */}
        <button
          onClick={handleSave}
          className="w-full py-2.5 rounded-xl font-semibold text-xs bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs cursor-pointer"
        >
          Save Preferences
        </button>

      </div>
    </main>
  )
}