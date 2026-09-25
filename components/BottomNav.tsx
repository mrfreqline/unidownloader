'use client'

import { useState, useEffect } from 'react'
import { Download, Eye, Scissors, Music, User } from 'lucide-react'

export type TabType = 'home' | 'viewer' | 'clip' | 'mp3' | 'account'

interface BottomNavProps {
  activeTab: TabType
  onSelectTab: (tab: TabType) => void
  isLoggedIn?: boolean
}

export default function BottomNav({ activeTab, onSelectTab, isLoggedIn }: BottomNavProps) {
  const [isStandaloneApp, setIsStandaloneApp] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // ONLY show bottom bar if running as an installed standalone PWA / APK webview
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')

      setIsStandaloneApp(isStandalone)
    }
  }, [])

  // If in web browser, do NOT render bottom navigation — users use the top navbar to avoid ad banner collision!
  if (!isStandaloneApp) return null

  const tabs = [
    { id: 'home' as TabType, label: 'Downloader', icon: Download },
    { id: 'viewer' as TabType, label: 'Viewer', icon: Eye },
    { id: 'clip' as TabType, label: 'Clip', icon: Scissors },
    { id: 'mp3' as TabType, label: 'MP3', icon: Music },
    { id: 'account' as TabType, label: 'Account', icon: User },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#090b0e]/95 dark:bg-[#090b0e]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
      role="navigation"
      aria-label="App Bottom Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition cursor-pointer select-none ${
              isActive
                ? 'text-emerald-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-300 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-emerald-500/15' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
