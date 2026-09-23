'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import TokenModal from '@/components/TokenModal'
import AuthPromptModal from '@/components/AuthPromptModal'
import MediaCard, { AnalyzedMedia } from '@/components/MediaCard'
import EphemeralBanner from '@/components/EphemeralBanner'
import { EnhancementSettings } from '@/components/MediaEnhancer'
import { supabase } from '@/lib/supabase'
import MagicProgressBar from '@/components/MagicProgressBar'
import FolderExplorer from '@/components/FolderExplorer'
import AdBanner from '@/components/AdBanner'
import InSiteAdPopup from '@/components/InSiteAdPopup'
import PwaInstallPrompt from '@/components/PwaInstallPrompt'
import AppDownloadModal from '@/components/AppDownloadModal'
import SeoContent from '@/components/SeoContent'
import DonationSection from '@/components/DonationSection'
import { FolderResult } from '@/lib/downloader/terabox-resolver'
import {
  Link2,
  ClipboardPaste,
  X,
  Search,
  Zap,
  Sliders,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  FileAudio,
  FileImage,
  Compass,
  Monitor,
  Smartphone,
} from 'lucide-react'

const AD_SMARTLINK = 'https://www.profitableratecpmnetwork.com/gvwaq8hih?key=3a220d2a7e229bd864d3aac504d1e304'

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark')

  // Opens the ad in a background new tab exactly once per analyze — no popunder, no interruption
  const openAdOnce = () => {
    try { window.open(AD_SMARTLINK, '_blank', 'noopener,noreferrer') } catch { /* blocked by browser, ignore */ }
  }

  // Auth & Token economy
  const [tokens, setTokens] = useState(12)
  const [guestTrials, setGuestTrials] = useState(3)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | undefined>()

  // Mobile In-App Browser detection
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)
  const [inAppName, setInAppName] = useState('')

  // Modals
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isAppModalOpen, setIsAppModalOpen] = useState(false)
  const [authReason, setAuthReason] = useState<'4k' | 'limit' | 'manual'>('manual')

  // Downloader input
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')
  const [inspectCount, setInspectCount] = useState(0)
  const [analyzedMedia, setAnalyzedMedia] = useState<AnalyzedMedia | null>(null)
  const [folderData, setFolderData] = useState<FolderResult | null>(null)
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null)
  const [maintenanceMsg, setMaintenanceMsg] = useState<string | null>(null)
  const [directDownloadLink, setDirectDownloadLink] = useState<{ url: string; filename: string } | null>(null)


  useEffect(() => {
    // Detect mobile in-app webview (Instagram, TikTok, Facebook, etc.)
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera || ''
      if (/Instagram/i.test(ua)) {
        setIsInAppBrowser(true)
        setInAppName('Instagram')
      } else if (/TikTok|musical_ly|ByteLocale/i.test(ua)) {
        setIsInAppBrowser(true)
        setInAppName('TikTok')
      } else if (/FBAN|FBAV/i.test(ua)) {
        setIsInAppBrowser(true)
        setInAppName('Facebook')
      } else if (/WhatsApp/i.test(ua)) {
        setIsInAppBrowser(true)
        setInAppName('WhatsApp')
      } else if (/Line\/|Twitter|Snapchat/i.test(ua)) {
        setIsInAppBrowser(true)
        setInAppName('In-App Browser')
      }
    }

    const savedTheme = (localStorage.getItem('unidownloader_theme') as any) || 'dark'
    setTheme(savedTheme)
    applyTheme(savedTheme)

    const savedTokens = localStorage.getItem('unidownloader_tokens')
    if (savedTokens !== null) {
      setTokens(parseInt(savedTokens, 10))
    } else {
      localStorage.setItem('unidownloader_tokens', '12')
    }

    const savedTrials = localStorage.getItem('unidownloader_guest_trials')
    if (savedTrials !== null) {
      setGuestTrials(parseInt(savedTrials, 10))
    } else {
      localStorage.setItem('unidownloader_guest_trials', '3')
    }

    // Sync guest trials with real server IP-based quota (anti-abuse)
    fetch('/api/user/ip-quota')
      .then(res => res.json())
      .then(data => {
        if (data?.success && typeof data.trialsLeft === 'number') {
          setGuestTrials(data.trialsLeft)
          localStorage.setItem('unidownloader_guest_trials', data.trialsLeft.toString())
        }
      })
      .catch(() => {})

    // Check live Supabase authentication session
    if (supabase) {
      const client = supabase
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setIsLoggedIn(true)
          const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Account'
          setUserEmail(name)

          // Fetch profile tokens from PostgreSQL
          client
            .from('profiles')
            .select('tokens, full_name')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => {
              if (data) {
                if (data.tokens !== undefined) setTokens(data.tokens)
                if (data.full_name) setUserEmail(data.full_name)
              }
            })
        }
      })

      const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setIsLoggedIn(true)
          const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Account'
          setUserEmail(name)

          const { data } = await client
            .from('profiles')
            .select('tokens, full_name')
            .eq('id', session.user.id)
            .single()

          if (data) {
            if (data.tokens !== undefined) setTokens(data.tokens)
            if (data.full_name) setUserEmail(data.full_name)
          }
        } else {
          setIsLoggedIn(false)
          setUserEmail(undefined)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } else {
      const savedUser = localStorage.getItem('unidownloader_user')
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          setIsLoggedIn(true)
          setUserEmail(parsed.email || parsed.name)
        } catch {}
      }
    }
  }, [])

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem('unidownloader_theme', newTheme)
    const isDark =
      newTheme === 'dark' ||
      (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }

  const handleAddTokens = async (amount: number) => {
    setTokens(prev => {
      const next = prev + amount
      localStorage.setItem('unidownloader_tokens', next.toString())
      return next
    })
    setGuestTrials(prev => {
      const next = prev + amount
      localStorage.setItem('unidownloader_guest_trials', next.toString())
      return next
    })

    // Sync reward to server IP-based quota
    fetch('/api/user/ip-quota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reward', amount }),
    }).catch(() => {})

    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const res = await fetch('/api/user/tokens', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: 'add',
              amount,
              userId: session.user.id,
            }),
          })
          const data = await res.json()
          if (data.tokens !== undefined) {
            setTokens(data.tokens)
            localStorage.setItem('unidownloader_tokens', data.tokens.toString())
          }
        }
      } catch (err) {
        console.error('Failed to sync added tokens to database:', err)
      }
    }
  }

  const deductTokens = async (
    amount: number,
    downloadData?: {
      url: string
      title: string
      format: string
      mediaType: string
      thumbnailUrl?: string
    }
  ) => {
    setTokens(prev => {
      const next = Math.max(0, prev - amount)
      localStorage.setItem('unidownloader_tokens', next.toString())
      return next
    })

    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const res = await fetch('/api/user/tokens', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: 'deduct',
              amount,
              userId: session.user.id,
              downloadData,
            }),
          })
          const data = await res.json()
          if (data.tokens !== undefined) {
            setTokens(data.tokens)
            localStorage.setItem('unidownloader_tokens', data.tokens.toString())
          }
        }
      } catch (err) {
        console.error('Failed to sync token deduction to database:', err)
      }
    }
  }

  const recordFreeDownload = async (downloadData: {
    url: string
    title: string
    format: string
    mediaType: string
    thumbnailUrl?: string
  }) => {
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await fetch('/api/user/tokens', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: 'record_free',
              userId: session.user.id,
              downloadData,
            }),
          })
        }
      } catch (err) {
        console.warn('Failed to record free download:', err)
      }
    }
  }

  const deductGuestTrial = () => {
    setGuestTrials(prev => {
      const next = Math.max(0, prev - 1)
      localStorage.setItem('unidownloader_guest_trials', next.toString())
      return next
    })
    fetch('/api/user/ip-quota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deduct' }),
    }).catch(() => {})
  }

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setUrl(text.trim())
        setError('')
      }
    } catch {
      setError('Clipboard access denied. Please paste manually into the field.')
    }
  }

  const handleAnalyze = async () => {
    setInspectCount(prev => prev + 1)

    setError('')
    setDownloadSuccessMsg(null)
    setDirectDownloadLink(null)

    // Sanitize input: strip quotes, zero-width characters, spaces
    let trimmed = url.trim().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/^["']|["']$/g, '').trim()

    if (!trimmed) {
      setError('Please provide a media URL to analyze.')
      return
    }

    // Auto-fix URL without protocol (e.g. www.youtube.com/... or youtu.be/...)
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed
    }

    try {
      new URL(trimmed)
    } catch {
      setError('Please provide a valid URL (including https://).')
      return
    }

    setIsAnalyzing(true)
    setAnalyzedMedia(null)
    setFolderData(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Unable to inspect media. Check the link and try again.')
      } else if (data.isMaintenance) {
        setMaintenanceMsg(data.message)
        setError('')
      } else {
        setMaintenanceMsg(null)

        if (data.folderData) {
          setFolderData(data.folderData)
        }

        let totalSecs = data.durationSeconds
        if (!totalSecs && data.duration) {
          const parts = String(data.duration).split(':').map(Number)
          if (parts.length === 2 && !parts.some(isNaN)) totalSecs = parts[0] * 60 + parts[1]
          else if (parts.length === 3 && !parts.some(isNaN)) totalSecs = parts[0] * 3600 + parts[1] * 60 + parts[2]
        }

        setAnalyzedMedia({
          title: data.title || 'Extracted Media Stream',
          thumbnail: data.thumbnail || '',
          duration: data.duration,
          durationSeconds: totalSecs && totalSecs > 0 ? totalSecs : 600,
          uploader: data.uploader,
          platform: data.platform || 'Direct Media',
          originalUrl: trimmed,
          qualities: data.qualities || ['1080p Full HD', '720p HD', 'Audio Only'],
          isDirectFile: data.isDirectFile,
          fileType: data.fileType || 'video',
          streamUrl: data.streamUrl,
          downloadUrl: data.downloadUrl,
          audioUrl: data.audioUrl,
          isDirectMovie: data.isDirectMovie,
          fileSize: data.fileSize,
          formats: data.formats,
          images: data.images,
        })
        // Open ad in background tab once after successful inspect — user stays on the page uninterrupted
        openAdOnce()
      }
    } catch {
      setError('Connection failed. Ensure the server is online.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDownload = async (
    format: string,
    mediaType: 'video' | 'audio' | 'image',
    enhancement: EnhancementSettings,
    downloadUrl?: string
  ) => {
    if (!analyzedMedia) return

    // IP-based guest trial limit check
    if (!isLoggedIn && guestTrials <= 0 && mediaType === 'video') {
      setError('Daily free download trials reached for your IP. Watch a short sponsor ad to get +4 tokens!')
      setAuthReason('limit')
      setIsTokenModalOpen(true)
      return
    }

    // Open ad in background tab on every download click — user stays on page, download proceeds normally
    openAdOnce()

    setIsDownloading(true)
    setError('')
    setDownloadSuccessMsg(null)

    // Smoothly auto-scroll up so the user clearly sees the progress bar & download status
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 120, behavior: 'smooth' })
    }

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      let endpoint = `${origin}/api/download`
      let payload: any = {
        url: analyzedMedia.originalUrl,
        quality: format,
        mediaType,
        enhancement,
        downloadUrl: downloadUrl || analyzedMedia.downloadUrl,
        title: analyzedMedia.title,
      }

      if (mediaType === 'image') {
        endpoint = `${origin}/api/thumbnail`
        let targetImg = downloadUrl
        if (
          !targetImg ||
          (analyzedMedia.fileType !== 'image' && targetImg === analyzedMedia.downloadUrl) ||
          targetImg.includes('.mp4') ||
          targetImg.includes('/o1/v/') ||
          targetImg.includes('rapidcdn.app/v2')
        ) {
          targetImg =
            analyzedMedia.thumbnail ||
            (analyzedMedia.images && analyzedMedia.images[0]?.url) ||
            analyzedMedia.downloadUrl
        }
        payload = {
          thumbnailUrl: targetImg,
          title: analyzedMedia.title,
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Server stream failed')
      }

      const contentType = res.headers.get('content-type') || ''
      if (
        contentType.includes('video') ||
        contentType.includes('audio') ||
        contentType.includes('octet-stream') ||
        contentType.includes('image')
      ) {
        const blob = await res.blob()
        const disposition = res.headers.get('content-disposition') || ''
        let filename = 'download'
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        } else {
          filename = `${analyzedMedia.title.slice(0, 30)}.${
            mediaType === 'audio' ? 'mp3' : mediaType === 'image' ? 'jpg' : 'mp4'
          }`
        }

        const blobUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(blobUrl)

        if (mediaType === 'video') {
          if (!isLoggedIn && guestTrials > 0 && !format.includes('4K')) {
            deductGuestTrial()
          } else {
            const cost = format.includes('4K') ? 10 : format.includes('1080p') ? 5 : 2
            await deductTokens(cost, {
              url: analyzedMedia.originalUrl,
              title: analyzedMedia.title,
              format,
              mediaType,
              thumbnailUrl: analyzedMedia.thumbnail,
            })
          }
        } else {
          // Audio & image downloads are free
          if (isLoggedIn) {
            await recordFreeDownload({
              url: analyzedMedia.originalUrl,
              title: analyzedMedia.title,
              format: mediaType === 'audio' ? 'mp3' : 'image',
              mediaType,
              thumbnailUrl: analyzedMedia.thumbnail,
            })
          }
        }

        setDownloadSuccessMsg(`Download initiated: ${filename}`)
      } else {
        const data = await res.json()
        if (data.redirectUrl) {
          const defaultFilename = mediaType === 'image' ? 'image.jpg' : mediaType === 'audio' ? 'audio.mp3' : 'media.mp4'
          const filename = data.filename || defaultFilename
          setDirectDownloadLink({ url: data.redirectUrl, filename })

          // Trigger native browser save directly into Downloads folder using blob URL
          try {
            const blobRes = await fetch(data.redirectUrl)
            const blobData = await blobRes.blob()
            const blobUrl = window.URL.createObjectURL(blobData)
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = filename
            document.body.appendChild(a)
            a.click()
            setTimeout(() => {
              window.URL.revokeObjectURL(blobUrl)
              try { document.body.removeChild(a) } catch {}
            }, 1000)
          } catch {
            const a = document.createElement('a')
            a.href = data.redirectUrl
            a.download = filename
            document.body.appendChild(a)
            a.click()
            setTimeout(() => {
              try { document.body.removeChild(a) } catch {}
            }, 1000)
          }

          if (mediaType === 'video') {
            if (!isLoggedIn && guestTrials > 0 && !format.includes('4K')) {
              deductGuestTrial()
            } else if (isLoggedIn) {
              const cost = format.includes('4K') ? 10 : format.includes('1080p') ? 5 : 2
              await deductTokens(cost, {
                url: analyzedMedia.originalUrl,
                title: analyzedMedia.title,
                format,
                mediaType,
                thumbnailUrl: analyzedMedia.thumbnail,
              })
            }
          }
          setDownloadSuccessMsg(`Download started: ${data.filename || 'media.mp4'}`)
        } else if (data.success || data.message) {
          setDownloadSuccessMsg(data.message || 'Media file transferred successfully.')
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Download failed. Please try a different quality format.')
    } finally {
      setIsDownloading(false)
    }
  }

  const platforms = [
    { name: 'TeraBox / ShareBox', type: 'Folders & Files' },
    { name: 'TikTok', type: 'No Watermark HD' },
    { name: 'Instagram', type: 'Reels & Posts' },
    { name: 'Facebook', type: 'Full HD Videos' },
    { name: 'Twitter / X', type: 'High Bitrate' },
    { name: 'Twitch', type: 'Clips & VODs' },
    { name: 'Reddit', type: 'Merged Audio' },
    { name: 'Direct Movies', type: '.mp4 / .mkv / .webm' },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-150 overflow-x-hidden">
      
      {/* Precision Top Navbar */}
      <Navbar
        tokens={tokens}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        onOpenAuthModal={() => {
          setAuthReason('manual')
          setIsAuthModalOpen(true)
        }}
        onOpenAppModal={() => setIsAppModalOpen(true)}
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        onLogout={async () => {
          if (supabase) {
            await supabase.auth.signOut()
          }
          localStorage.removeItem('unidownloader_user')
          setIsLoggedIn(false)
          setUserEmail(undefined)
        }}
        theme={theme}
        onThemeChange={applyTheme}
      />

      {/* Small bottom bar ad — only visible after user has analyzed a link (no redirect, closeable) */}
      <InSiteAdPopup show={!!analyzedMedia} />

      {/* PWA Mobile & Desktop Install Prompt */}
      <PwaInstallPrompt />

      {/* Main Container: Optimized padding for mobile screens */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-3 pt-2 sm:pt-4">
          <div className="flex justify-center">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-emerald-500/20 bg-black animate-in zoom-in-95 duration-200">
              <img
                src="/logo-icon.jpg"
                alt="A2Z Downloader Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-mono bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
            <Zap className="w-3 h-3 text-emerald-500 shrink-0" />
            Universal Media Protocol • Zero Retention Active
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              A2Z
            </span>{' '}
            Downloader
          </h1>

          <p className="text-sm sm:text-base font-semibold text-zinc-700 dark:text-zinc-300">
            Download Media. Simple & Fast.
          </p>

          <p className="text-xs sm:text-sm text-zinc-500 max-w-xl mx-auto leading-relaxed px-2">
            Download any video, movie, or audio in the entire world. TikTok, Instagram, YouTube, Facebook, Twitter/X, and direct links in 1 click.
          </p>

          {/* Quick App Download Shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <a
              href="/apps/A2Z-Downloader-Setup.exe"
              download="A2Z-Downloader-Setup.exe"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 transition shadow-xs cursor-pointer touch-manipulation"
              title="Download Windows .EXE Installer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Windows App (.exe)</span>
            </a>
            <button
              type="button"
              onClick={() => setIsAppModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition shadow-xs cursor-pointer touch-manipulation"
              title="Install Mobile App (.apk / WebAPK)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone App (.apk)</span>
            </button>
          </div>
        </div>

        {/* Mobile In-App Browser Assistant Banner */}
        {isInAppBrowser && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs animate-in fade-in-50">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  {inAppName} In-App Browser Detected
                </span>
                <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  In-app browsers can restrict saving files directly. For instant downloads, tap <strong>•••</strong> at the top right and choose <strong>&quot;Open in Chrome / Safari&quot;</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Input & Search Console */}
        <div className="space-y-2.5">
          <div className="relative rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-sm transition-all focus-within:border-zinc-500 dark:focus-within:border-zinc-700 p-1.5 sm:p-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              <div className="pl-2 sm:pl-3 text-zinc-400 shrink-0">
                <Link2 className="w-4 h-4" />
              </div>

              <input
                type="url"
                value={url}
                onChange={e => {
                  setUrl(e.target.value)
                  setError('')
                  setMaintenanceMsg(null)
                }}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                placeholder="Paste link here (YouTube, TeraBox, ShareBox, TikTok, Instagram, Movies)..."
                className="flex-1 py-2 text-xs sm:text-sm bg-transparent text-zinc-900 dark:text-zinc-100 outline-none font-mono placeholder:text-zinc-400 placeholder:font-sans min-w-0"
              />

              {/* Paste or Clear Button */}
              {url ? (
                <button
                  onClick={() => {
                    setUrl('')
                    setMaintenanceMsg(null)
                    setFolderData(null)
                    setAnalyzedMedia(null)
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition touch-manipulation cursor-pointer shrink-0"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handlePasteClipboard}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition touch-manipulation cursor-pointer shrink-0"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Paste</span>
                </button>
              )}

              {/* Analyze Action */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 touch-manipulation min-h-[40px]"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="hidden xs:inline">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Supported Format Hint */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] sm:text-[11px] text-zinc-400 font-mono">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="flex items-center gap-1">
                <FileVideo className="w-3 h-3 text-zinc-400" /> MP4 / Movies
              </span>
              <span className="flex items-center gap-1">
                <FileAudio className="w-3 h-3 text-emerald-500" /> Audio (Free)
              </span>
              <span className="flex items-center gap-1">
                <FileImage className="w-3 h-3 text-emerald-500" /> Watch Mode
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium hidden xs:inline">
                Free Worldwide Access
              </span>
              <Link
                href="/mp3"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35 transition shadow-xs cursor-pointer group"
                title="Open Dedicated Fast MP3 Downloader"
              >
                <Zap className="w-3 h-3 text-emerald-500 fill-current" />
                <span>Download MP3 Fast Here</span>
                <span className="group-hover:translate-x-0.5 transition-transform text-xs">↗</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Top Sponsor Ad Banner */}
        <AdBanner slot="top" />

        {/* Magic Progress Bar Loading Animation */}
        {(isAnalyzing || isDownloading) && (
          <MagicProgressBar
            isActive={isAnalyzing || isDownloading}
            mode={isAnalyzing ? 'analyzing' : 'downloading'}
          />
        )}

        {/* YouTube Maintenance Notification Banner */}
        {maintenanceMsg && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs sm:text-sm space-y-2 animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>YouTube Engine Maintenance Notice</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
              {maintenanceMsg}
            </p>
            <div className="pt-1 flex flex-wrap gap-1.5 text-[10px] sm:text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                TikTok: Active (No Watermark)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                Instagram: Active
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                Facebook / X: Active
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                Direct Movies: Active
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in-50">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-mono text-[11px] sm:text-xs">{error}</span>
          </div>
        )}

        {/* Download Success Alert */}
        {downloadSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-mono text-[11px] sm:text-xs">{downloadSuccessMsg}</span>
            </div>
            {directDownloadLink && (
              <a
                href={directDownloadLink.url}
                download={directDownloadLink.filename}
                className="text-[11px] font-medium underline text-emerald-700 dark:text-emerald-300 hover:text-emerald-500 cursor-pointer shrink-0"
              >
                Click here if file did not save automatically
              </a>
            )}
          </div>
        )}

        {/* TeraBox / ShareBox Interactive Folder Explorer */}
        {folderData && (
          <FolderExplorer
            initialFolder={folderData}
            onClose={() => setFolderData(null)}
          />
        )}

        {/* Analyzed Media Result Component (Standard Single-File Flow) */}
        {analyzedMedia && !folderData && (
          <MediaCard
            media={analyzedMedia}
            tokens={tokens}
            guestDownloadsLeft={guestTrials}
            isLoggedIn={isLoggedIn}
            onDownload={handleDownload}
            isDownloading={isDownloading}
            onRequireAuth={reason => {
              setAuthReason(reason)
              setIsAuthModalOpen(true)
            }}
            onRequireTokens={() => setIsTokenModalOpen(true)}
          />
        )}

        {/* Platform Grid Pills */}
        {!analyzedMedia && !folderData && (
          <div className="space-y-2.5 pt-1">
            <span className="text-[10px] sm:text-[11px] font-mono text-zinc-400 uppercase tracking-wider block text-center">
              Supported Media Sources
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {platforms.map(p => (
                <div
                  key={p.name}
                  className="p-2 sm:p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white/60 dark:bg-zinc-900/40 text-center"
                >
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block truncate">
                    {p.name}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400 block mt-0.5 truncate">
                    {p.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ephemeral Zero-Retention Storage Banner */}
        <EphemeralBanner />

        {/* Engineering Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Media Enhancement
            </h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Optional trim, container conversion (MP4, WebM, MKV, GIF, MP3), and audio normalization before downloading.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <HardDrive className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Zero Server Retention
            </h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Streams directly to client memory. Temporary files are unlinked on transfer or session exit to guarantee zero clutter.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Token Economy
            </h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Free unlimited audio & thumbnails. 3 free video trials. Earn extra video tokens effortlessly by watching short sponsor ads.
            </p>
          </div>
        </div>

        {/* Donation / Buy Us a Coffee Section */}
        <DonationSection />

        {/* SEO Informational & FAQ Section */}
        <SeoContent />

        {/* Bottom Sponsor Ad Banner */}
        <AdBanner slot="bottom" />

      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-6 text-center text-xs text-zinc-400 font-mono">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo-icon.jpg" alt="A2Z" className="w-4 h-4 rounded-md object-cover inline" />
            <span>A2Z Downloader • Download Media. Simple & Fast.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="#donate"
              className="text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 transition"
            >
              ☕ Buy Us a Coffee
            </a>
            <span>•</span>
            <button
              onClick={() => setIsTokenModalOpen(true)}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition touch-manipulation cursor-pointer"
            >
              Token Rules
            </button>
            <span>•</span>
            <span className="text-emerald-500">Auto-Purge Active</span>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        tokens={tokens}
        guestDownloadsLeft={guestTrials}
        onAddTokens={handleAddTokens}
        isLoggedIn={isLoggedIn}
        onOpenAuth={() => {
          setIsTokenModalOpen(false)
          setAuthReason('manual')
          setIsAuthModalOpen(true)
        }}
      />

      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        reason={authReason}
        onSuccess={email => {
          setIsLoggedIn(true)
          setUserEmail(email)
        }}
      />

      <AppDownloadModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
      />

    </div>
  )
}