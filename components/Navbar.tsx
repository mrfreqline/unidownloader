'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Download,
  Eye,
  Scissors,
  Music,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  Coffee,
  Sparkles,
} from 'lucide-react'

export type NavTabType = 'home' | 'viewer' | 'clip' | 'editor' | 'mp3' | 'account'

interface NavbarProps {
  tokens?: number
  onOpenTokenModal?: () => void
  onOpenAuthModal?: () => void
  onOpenAppModal?: () => void
  isLoggedIn?: boolean
  userEmail?: string
  onLogout?: () => void
  theme: 'light' | 'dark' | 'system'
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void
  activeTab?: string
  onSelectTab?: (tab: any) => void
}

export default function Navbar({
  theme,
  onThemeChange,
  activeTab = 'home',
  onSelectTab,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navTabs = [
    { id: 'home' as NavTabType, label: 'Downloader', icon: Download, href: '/' },
    { id: 'clip' as NavTabType, label: 'Media Clip', icon: Scissors, href: '/#clip' },
    { id: 'editor' as NavTabType, label: 'Studio Editor', icon: Sparkles, href: '/editor' },
    { id: 'viewer' as NavTabType, label: 'Anonymous Viewer', icon: Eye, href: '/anonymous-viewer' },
    { id: 'mp3' as NavTabType, label: 'MP3 Fast', icon: Music, href: '/mp3' },
    { id: 'account' as NavTabType, label: 'Settings', icon: Settings, href: '/#account' },
  ]

  const handleTabClick = (tab: typeof navTabs[0]) => {
    setIsMobileMenuOpen(false)
    if (tab.id === 'editor') {
      window.location.href = '/editor'
      return
    }
    if (onSelectTab) {
      onSelectTab(tab.id)
    } else {
      window.location.href = tab.href
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-white/10 bg-white/85 dark:bg-[#090b0e]/85 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={(e) => {
              if (onSelectTab) {
                e.preventDefault()
                onSelectTab('home')
              }
            }}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md shadow-emerald-500/10 border border-emerald-500/20 bg-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img src="/logo-icon.jpg" alt="A2Z Downloader" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-1">
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  A2Z
                </span>
                <span>Downloader</span>
              </span>
              <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 hidden sm:inline">
                Universal Media Engine
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Frosted Glass Desktop Tabs (Hidden on small phones, visible on tablets & laptops) */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-zinc-100/90 dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 shadow-xs">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-zinc-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Right: Coffee / Donate Link + Theme Toggle + Mobile Hamburger Button */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Coffee / Donate Button (Direct link to /donate) */}
          <Link
            href="/donate"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 transition cursor-pointer shadow-xs group"
            title="Buy Us a Coffee / Donate"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform duration-200" />
            <span className="hidden sm:inline">Coffee</span>
          </Link>

          {/* Theme Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-[#171b21] border border-zinc-200 dark:border-white/10 text-zinc-500">
            <button
              onClick={() => onThemeChange('light')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                theme === 'light' ? 'bg-white text-zinc-900 shadow-xs' : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Light theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onThemeChange('dark')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                theme === 'dark' ? 'bg-zinc-800 text-zinc-100 shadow-xs' : 'hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="Dark theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Hamburger Button (Visible only on phone screens) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-zinc-100 dark:bg-[#171b21] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Dropdown Menu (Opens smoothly on phone browser) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#090b0e]/95 backdrop-blur-2xl px-4 py-3 space-y-1.5 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-zinc-950 font-bold shadow-md'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                <span className="text-sm">{tab.label}</span>
              </button>
            )
          })}
          
          <Link
            href="/donate"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer text-left bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          >
            <Coffee className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">Buy Us a Coffee / Support Project</span>
          </Link>
        </div>
      )}
    </header>
  )
}
