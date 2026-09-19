'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import TokenModal from '@/components/TokenModal'
import AuthPromptModal from '@/components/AuthPromptModal'
import MediaCard, { AnalyzedMedia } from '@/components/MediaCard'
import EphemeralBanner from '@/components/EphemeralBanner'
import { EnhancementSettings } from '@/components/MediaEnhancer'
import { supabase } from '@/lib/supabase'
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
} from 'lucide-react'

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark')

  // Auth & Token economy
  const [tokens, setTokens] = useState(12)
  const [guestTrials, setGuestTrials] = useState(3)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | undefined>()

  // Modals
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authReason, setAuthReason] = useState<'4k' | 'limit' | 'manual'>('manual')

  // Downloader input
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')
  const [analyzedMedia, setAnalyzedMedia] = useState<AnalyzedMedia | null>(null)
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
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
    setError('')
    setDownloadSuccessMsg(null)
    const trimmed = url.trim()

    if (!trimmed) {
      setError('Please provide a media URL to analyze.')
      return
    }

    try {
      new URL(trimmed)
    } catch {
      setError('Please provide a valid URL (including https://).')
      return
    }

    setIsAnalyzing(true)
    setAnalyzedMedia(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Unable to inspect media. Check the link and try again.')
      } else {
        setAnalyzedMedia({
          title: data.title || 'Extracted Media Stream',
          thumbnail: data.thumbnail || '',
          duration: data.duration,
          durationSeconds: data.durationSeconds || 180,
          uploader: data.uploader,
          platform: data.platform || 'Direct Media',
          originalUrl: trimmed,
          qualities: data.qualities || ['1080p', '720p', '360p'],
          isDirectFile: data.isDirectFile,
          fileType: data.fileType || 'video',
        })
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
    enhancement: EnhancementSettings
  ) => {
    if (!analyzedMedia) return
    setIsDownloading(true)
    setError('')
    setDownloadSuccessMsg(null)

    try {
      let endpoint = '/api/download'
      let payload: any = {
        url: analyzedMedia.originalUrl,
        quality: format,
        mediaType,
        enhancement,
      }

      if (mediaType === 'image') {
        endpoint = '/api/thumbnail'
        payload = {
          thumbnailUrl: analyzedMedia.thumbnail,
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
          if (!isLoggedIn && guestTrials > 0 && format !== '4K') {
            deductGuestTrial()
          } else {
            const cost = format === '4K' ? 10 : format === '1080p' ? 5 : 2
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
        if (data.success || data.message) {
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
    { name: 'YouTube', type: 'Video / Audio' },
    { name: 'TikTok', type: 'No Watermark' },
    { name: 'Instagram', type: 'Reels / Posts' },
    { name: 'Twitter / X', type: 'High Bitrate' },
    { name: 'Reddit', type: 'Merged Audio' },
    { name: 'Vimeo', type: 'Full HD' },
    { name: 'Direct Links', type: '.mp4 / .jpg' },
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

      {/* Main Container: Optimized padding for mobile screens */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-2.5 pt-2 sm:pt-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-mono bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
            <Zap className="w-3 h-3 text-amber-500 shrink-0" />
            Universal Media Protocol • Ephemeral Cache
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
            Download Any Video, Audio, or Image
          </h1>

          <p className="text-xs sm:text-sm text-zinc-500 max-w-xl mx-auto leading-relaxed px-2">
            Extract high-fidelity media from social platforms or direct URLs. Optional precision trimming, compression, and format conversion.
          </p>
        </div>

        {/* Input & Search Console: One-tap clipboard paste for mobile */}
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
                }}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                placeholder="Paste media link here (YouTube, TikTok, Instagram, Twitter, etc.)..."
                className="flex-1 py-2 text-xs sm:text-sm bg-transparent text-zinc-900 dark:text-zinc-100 outline-none font-mono placeholder:text-zinc-400 placeholder:font-sans min-w-0"
              />

              {/* Paste or Clear Button: Always accessible on mobile */}
              {url ? (
                <button
                  onClick={() => setUrl('')}
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
                <FileVideo className="w-3 h-3 text-zinc-400" /> MP4 / 4K
              </span>
              <span className="flex items-center gap-1">
                <FileAudio className="w-3 h-3 text-emerald-500" /> Audio (Free)
              </span>
              <span className="flex items-center gap-1">
                <FileImage className="w-3 h-3 text-emerald-500" /> Cover (Free)
              </span>
            </div>

            <div className="text-zinc-500">
              {guestTrials > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {guestTrials} free trials
                </span>
              ) : (
                <span>{tokens} tokens</span>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in-50">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-mono text-[11px] sm:text-xs">{error}</span>
          </div>
        )}

        {/* Download Success Alert */}
        {downloadSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in-50">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-mono text-[11px] sm:text-xs">{downloadSuccessMsg}</span>
          </div>
        )}

        {/* Analyzed Media Result Component */}
        {analyzedMedia && (
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
        {!analyzedMedia && (
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

      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-6 text-center text-xs text-zinc-400 font-mono">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>UniDownloader Engine • Personal Fair-Use Tool</span>
          <div className="flex items-center gap-4 text-[11px]">
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

    </div>
  )
}