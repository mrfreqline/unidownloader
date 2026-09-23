'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Music,
  Zap,
  Download,
  Search,
  ClipboardPaste,
  X,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  Headphones,
  ArrowLeft,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Coffee,
  HelpCircle,
  ListMusic,
  SkipForward,
} from 'lucide-react'
import DonationSection from '@/components/DonationSection'

interface AnalyzedAudio {
  title: string
  thumbnail: string
  duration?: string
  durationSeconds?: number
  uploader?: string
  platform: string
  originalUrl: string
  downloadUrl?: string
  audioUrl?: string
  formats?: Array<{ quality?: string | number; label?: string; url: string; type?: string }>
}

type TrackStatus = 'idle' | 'loading' | 'done' | 'error'

interface PlaylistTrackItem {
  id: string
  title: string
  artist?: string
  thumbnail?: string
  duration?: string
  youtubeUrl?: string
  searchQuery?: string
  status: TrackStatus
  error?: string
}

interface PlaylistCollection {
  source: 'youtube' | 'spotify'
  kind: 'playlist' | 'album' | 'track'
  title: string
  thumbnail?: string
  tracks: PlaylistTrackItem[]
  truncated: boolean
  note?: string
}

function looksLikePlaylistOrSpotify(raw: string): boolean {
  const trimmed = raw.trim()
  if (/^spotify:(playlist|album|track):/i.test(trimmed)) return true
  try {
    const u = new URL(trimmed)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    if (host.includes('spotify')) return true
    if (host.includes('youtube.com') || host === 'youtu.be') {
      if (u.pathname.includes('/playlist')) return true
      const list = u.searchParams.get('list') || ''
      return /^(PL|OL|UU|FL)/i.test(list)
    }
  } catch {}
  return false
}

function safeMp3Name(title: string) {
  return `${title.slice(0, 40).replace(/[^\w\s.-]/gi, '_').trim() || 'audio'}.mp3`
}

export default function Mp3Page() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark')
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [media, setMedia] = useState<AnalyzedAudio | null>(null)
  const [playlist, setPlaylist] = useState<PlaylistCollection | null>(null)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)
  const [selectedBitrate, setSelectedBitrate] = useState<'320k' | '192k' | '128k'>('320k')
  const cancelAllRef = useRef(false)

  useEffect(() => {
    const savedTheme = (localStorage.getItem('unidownloader_theme') as any) || 'dark'
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem('unidownloader_theme', newTheme)
    const isDark =
      newTheme === 'dark' ||
      (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setUrl(text.trim())
    } catch {
      setError('Clipboard access not granted. Please paste manually.')
    }
  }

  const handleAnalyze = async () => {
    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please paste a video or audio link')
      return
    }

    setIsAnalyzing(true)
    setError('')
    setSuccessMsg('')
    setMedia(null)
    setPlaylist(null)
    setIsDownloadingAll(false)
    cancelAllRef.current = true

    try {
      if (looksLikePlaylistOrSpotify(trimmed)) {
        const plRes = await fetch('/api/mp3/playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        })
        const plData = await plRes.json()
        if (!plRes.ok) {
          throw new Error(plData.error || 'Failed to load playlist')
        }
        setPlaylist({
          source: plData.source,
          kind: plData.kind,
          title: plData.title,
          thumbnail: plData.thumbnail,
          truncated: !!plData.truncated,
          note: plData.note,
          tracks: (plData.tracks || []).map((t: any) => ({
            ...t,
            status: 'idle' as TrackStatus,
          })),
        })
        return
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to inspect link')
      }

      let totalSecs = data.durationSeconds
      if (!totalSecs && data.duration) {
        const parts = String(data.duration).split(':').map(Number)
        if (parts.length === 2 && !parts.some(isNaN)) totalSecs = parts[0] * 60 + parts[1]
        else if (parts.length === 3 && !parts.some(isNaN)) totalSecs = parts[0] * 3600 + parts[1] * 60 + parts[2]
      }

      const durSecs = totalSecs && totalSecs > 0 ? totalSecs : 300

      setMedia({
        title: data.title || 'Audio Stream',
        thumbnail: data.thumbnail || '',
        duration: data.duration || '',
        durationSeconds: durSecs,
        uploader: data.uploader || 'Artist',
        platform: data.platform || 'Audio',
        originalUrl: trimmed,
        downloadUrl: data.downloadUrl,
        audioUrl: data.audioUrl,
        formats: data.formats,
      })
    } catch (err: any) {
      setError(err?.message || 'Could not fetch audio info. Ensure link is public.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const triggerBrowserDownload = async (res: Response, fallbackTitle: string) => {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('audio') || contentType.includes('octet-stream') || contentType.includes('video')) {
      const blob = await res.blob()
      const disposition = res.headers.get('content-disposition') || ''
      let filename = safeMp3Name(fallbackTitle)
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/)
      if (filenameMatch && filenameMatch[1]) filename = filenameMatch[1]

      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
        try {
          document.body.removeChild(a)
        } catch {}
      }, 1000)
      return filename
    }

    const data = await res.json()
    if (data.redirectUrl) {
      const filename = data.filename || safeMp3Name(fallbackTitle)
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
          try {
            document.body.removeChild(a)
          } catch {}
        }, 1000)
      } catch {
        const a = document.createElement('a')
        a.href = data.redirectUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
      }
      return filename
    }
    throw new Error('Audio conversion failed')
  }

  const convertYoutubeToMp3 = async (youtubeUrl: string, title: string) => {
    const analyzed = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: youtubeUrl }),
    })
    const data = await analyzed.json()
    if (!analyzed.ok) throw new Error(data.error || 'Failed to inspect YouTube audio')

    const targetAudioUrl = data.audioUrl || data.downloadUrl
    const payload = {
      url: youtubeUrl,
      quality: 'mp3',
      mediaType: 'audio',
      downloadUrl: targetAudioUrl,
      title,
      enhancement: {
        enabled: true,
        targetFormat: 'mp3',
        audioBitrate: selectedBitrate,
        trimEnabled: false,
        normalizeAudio: false,
        muteAudio: false,
      },
    }

    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.error || 'Audio conversion failed')
    }
    return triggerBrowserDownload(res, title)
  }

  const updateTrack = (id: string, patch: Partial<PlaylistTrackItem>) => {
    setPlaylist(prev => {
      if (!prev) return prev
      return {
        ...prev,
        tracks: prev.tracks.map(t => (t.id === id ? { ...t, ...patch } : t)),
      }
    })
  }

  const downloadPlaylistTrack = async (track: PlaylistTrackItem) => {
    setActiveTrackId(track.id)
    updateTrack(track.id, { status: 'loading', error: undefined })
    try {
      let youtubeUrl = track.youtubeUrl
      if (!youtubeUrl) {
        const q = track.searchQuery || [track.artist, track.title].filter(Boolean).join(' ')
        const resolved = await fetch('/api/mp3/resolve-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
        })
        const resolvedData = await resolved.json()
        if (!resolved.ok) throw new Error(resolvedData.error || 'No YouTube match')
        youtubeUrl = resolvedData.youtubeUrl
        updateTrack(track.id, { youtubeUrl, thumbnail: resolvedData.thumbnail || track.thumbnail })
      }
      await convertYoutubeToMp3(youtubeUrl!, track.title)
      updateTrack(track.id, { status: 'done' })
      return true
    } catch (err: any) {
      updateTrack(track.id, { status: 'error', error: err?.message || 'Failed' })
      return false
    } finally {
      setActiveTrackId(null)
    }
  }

  const handleDownloadNext = async () => {
    if (!playlist) return
    const next = playlist.tracks.find(t => t.status === 'idle' || t.status === 'error')
    if (!next) {
      setSuccessMsg('All songs in this list are already downloaded.')
      return
    }
    setError('')
    setSuccessMsg('')
    const ok = await downloadPlaylistTrack(next)
    if (ok) setSuccessMsg(`Saved MP3: ${next.title}`)
    else setError(next.title + ' failed. You can skip and download next.')
  }

  const handleDownloadAll = async () => {
    if (!playlist) return
    cancelAllRef.current = false
    setIsDownloadingAll(true)
    setError('')
    setSuccessMsg('')
    let done = 0
    let failed = 0
    const queue = playlist.tracks.filter(t => t.status !== 'done')
    for (const track of queue) {
      if (cancelAllRef.current) break
      const ok = await downloadPlaylistTrack(track)
      if (ok) done += 1
      else failed += 1
      await new Promise(r => setTimeout(r, 800))
    }
    setIsDownloadingAll(false)
    if (cancelAllRef.current) {
      setSuccessMsg(`Stopped. Saved ${done} MP3${done === 1 ? '' : 's'}.`)
    } else {
      setSuccessMsg(`Finished. Saved ${done} MP3${done === 1 ? '' : 's'}${failed ? `, ${failed} failed` : ''}.`)
    }
  }

  const handleDownload = async () => {
    if (!media) return

    setIsDownloading(true)
    setError('')
    setSuccessMsg('')

    try {
      const payload = {
        url: media.originalUrl,
        quality: 'mp3',
        mediaType: 'audio',
        downloadUrl: media.audioUrl || media.downloadUrl,
        title: media.title,
        enhancement: {
          enabled: true,
          targetFormat: 'mp3',
          audioBitrate: selectedBitrate,
          trimEnabled: false,
          normalizeAudio: false,
          muteAudio: false,
        },
      }

      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Audio conversion failed')
      }
      const filename = await triggerBrowserDownload(res, media.title)
      setSuccessMsg(`Downloaded successfully: ${filename}`)
    } catch (err: any) {
      setError(err?.message || 'Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-emerald-500/25 selection:text-emerald-800 dark:selection:text-emerald-300 transition-colors duration-200">
      {/* Top Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 sm:gap-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition py-1.5 px-2.5 sm:px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/60 hover:bg-zinc-200 dark:hover:bg-zinc-850 group shadow-xs"
          >
            <div className="w-5 h-5 rounded-md overflow-hidden bg-black flex items-center justify-center shrink-0 ring-1 ring-emerald-500/30">
              <img src="/logo-icon.jpg" alt="A2Z Downloader" className="w-full h-full object-cover" />
            </div>
            <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden xs:inline">Universal Downloader</span>
            <span className="xs:hidden">Back</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Engine Tag */}
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Fast MP3 Engine
            </span>

            {/* Support / Buy Us a Coffee Link */}
            <a
              href="#donate"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 transition cursor-pointer"
              title="Buy Us a Coffee (eSewa / Khalti / Bank QR)"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-500" />
              <span>Buy Coffee</span>
            </a>

            {/* FAQ Link */}
            <a
              href="#faq"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition cursor-pointer"
              title="Frequently Asked Questions"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>FAQ</span>
            </a>

            {/* Theme Selector: Light / System / Dark */}
            <div className="flex items-center p-0.5 sm:p-1 rounded-lg bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-800 text-zinc-500">
              <button
                onClick={() => applyTheme('light')}
                className={`p-1 sm:p-1.5 rounded-md transition touch-manipulation cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
                title="Light theme"
                aria-label="Light theme"
              >
                <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
              <button
                onClick={() => applyTheme('system')}
                className={`p-1 sm:p-1.5 rounded-md transition touch-manipulation cursor-pointer hidden sm:inline-block ${
                  theme === 'system'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
                title="System theme"
                aria-label="System theme"
              >
                <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
              <button
                onClick={() => applyTheme('dark')}
                className={`p-1 sm:p-1.5 rounded-md transition touch-manipulation cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
                title="Dark theme"
                aria-label="Dark theme"
              >
                <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Quick-Navigation Strip (<sm) */}
        <div className="sm:hidden border-t border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-md px-3 py-1.5 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar text-[11px] font-medium">
          <Link
            href="/"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-200/70 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-300/70 dark:border-zinc-800 transition shrink-0"
          >
            <ArrowLeft className="w-3 h-3 text-zinc-400" />
            <span>All Media</span>
          </Link>

          <a
            href="#donate"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 transition shrink-0"
          >
            <Coffee className="w-3 h-3 text-amber-500" />
            <span>Buy Coffee</span>
          </a>

          <a
            href="#faq"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-200/70 dark:bg-zinc-900 hover:bg-zinc-300/70 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-300/70 dark:border-zinc-800 transition shrink-0"
          >
            <HelpCircle className="w-3 h-3 text-emerald-500" />
            <span>FAQ</span>
          </a>

          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>320k Studio</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full space-y-10 sm:space-y-14">
        
        {/* Hero Section */}
        <section className="text-center space-y-3.5 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-xs">
            <Music className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>High Quality Audio Converter (320kbps)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
            Fast{' '}
            <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
              MP3 Downloader
            </span>
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Convert any video or music link into crystal-clear 320kbps MP3 audio in seconds.
            Works with YouTube, TikTok, Instagram Reels, Facebook, SoundCloud, and Reddit.
            Paste a YouTube playlist or Spotify playlist/album/track to list songs and download them one by one.
          </p>
        </section>

        {/* Input Card */}
        <section className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-3.5 sm:p-5 shadow-xl dark:shadow-2xl space-y-3 transition-colors">
          <div className="relative flex items-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition">
            <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400 ml-1 shrink-0" />
            
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              placeholder="Paste YouTube, playlist, Spotify, TikTok, or music link..."
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            />

            <div className="flex items-center gap-1.5 shrink-0">
              {url ? (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-100 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Paste</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Extract MP3</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 px-1 font-mono gap-2">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-500 fill-current" /> Direct Audio Stream • 100% Free & Unlimited
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Studio 320kbps Available</span>
          </div>
        </section>

        {/* Error / Success Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {playlist && (
          <section className="bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center justify-center">
                {playlist.thumbnail ? (
                  <img src={playlist.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ListMusic className="w-7 h-7 text-emerald-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                  {playlist.source === 'spotify' ? 'Spotify → YouTube MP3' : 'YouTube playlist'}
                </p>
                <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 line-clamp-2">
                  {playlist.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {playlist.tracks.length} song{playlist.tracks.length === 1 ? '' : 's'}
                  {playlist.truncated ? ' (first 50)' : ''}
                  {' · '}
                  {playlist.tracks.filter(t => t.status === 'done').length} saved
                </p>
              </div>
            </div>

            {playlist.note && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 bg-zinc-50 dark:bg-zinc-950/40">
                {playlist.note}
              </p>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block font-mono">
                MP3 bitrate for this list
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: '320k', label: '320 kbps', hint: 'Studio HD' },
                  { id: '192k', label: '192 kbps', hint: 'Standard' },
                  { id: '128k', label: '128 kbps', hint: 'Compact' },
                ].map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBitrate(b.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      selectedBitrate === b.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/40'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-zinc-700 dark:text-zinc-400'
                    }`}
                  >
                    <span className="font-bold text-xs block">{b.label}</span>
                    <span className="text-[10px] text-zinc-500">{b.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleDownloadNext}
                disabled={isDownloadingAll || !!activeTrackId}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <SkipForward className="w-4 h-4" />
                Download next
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isDownloadingAll) {
                    cancelAllRef.current = true
                    return
                  }
                  void handleDownloadAll()
                }}
                disabled={!!activeTrackId && !isDownloadingAll}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-zinc-950 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20"
              >
                {isDownloadingAll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    Stop
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    Download all one by one
                  </>
                )}
              </button>
            </div>

            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[420px] overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              {playlist.tracks.map((track, idx) => (
                <li key={track.id + idx} className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-zinc-950/30">
                  <span className="w-6 text-[11px] font-mono text-zinc-400 text-right shrink-0">{idx + 1}</span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0 flex items-center justify-center">
                    {track.thumbnail ? (
                      <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">{track.title}</p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {track.artist || 'Unknown artist'}
                      {track.duration ? ` · ${track.duration}` : ''}
                      {track.status === 'error' && track.error ? ` · ${track.error}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isDownloadingAll || !!activeTrackId || track.status === 'loading'}
                    onClick={() => {
                      setError('')
                      setSuccessMsg('')
                      void downloadPlaylistTrack(track).then(ok => {
                        if (ok) setSuccessMsg(`Saved MP3: ${track.title}`)
                      })
                    }}
                    className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer disabled:opacity-50 ${
                      track.status === 'done'
                        ? 'border-emerald-500/40 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'
                        : track.status === 'error'
                          ? 'border-red-400/40 text-red-600'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    {track.status === 'loading' || activeTrackId === track.id
                      ? 'Saving…'
                      : track.status === 'done'
                        ? 'Saved'
                        : track.status === 'error'
                          ? 'Retry'
                          : 'MP3'}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Analyzed Media Card - Pure & Fast without Enhancement Bloat */}
        {media && (
          <section className="bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 animate-in fade-in-50 duration-200 transition-colors">
            {/* Header with thumbnail */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 shrink-0 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                {media.thumbnail ? (
                  <img src={media.thumbnail} alt={media.title} className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-8 h-8 text-emerald-500" />
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white font-bold uppercase">
                  {media.platform}
                </div>
                {media.duration && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-zinc-300 font-bold">
                    {media.duration}
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1 min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                  {media.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <span>{media.uploader}</span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Ready for Fast MP3 Export
                  </span>
                </p>

                {/* Quality / Bitrate Selector */}
                <div className="pt-2 space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block font-mono">
                    Select Audio Quality (Bitrate):
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: '320k', label: '320 kbps', hint: 'Studio HD' },
                      { id: '192k', label: '192 kbps', hint: 'Standard' },
                      { id: '128k', label: '128 kbps', hint: 'Compact' },
                    ].map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBitrate(b.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          selectedBitrate === b.id
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm shadow-emerald-500/10'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-zinc-700 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <span className="font-bold text-xs sm:text-sm block">{b.label}</span>
                        <span className="text-[10px] text-zinc-500">{b.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Download Button - Direct High Quality MP3 */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-3.5 px-5 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 min-h-[50px]"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Converting & Saving MP3 to Device...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 stroke-[2.5]" />
                  <span>
                    Download MP3 ({selectedBitrate.replace('k', ' kbps')}) (Free)
                  </span>
                </>
              )}
            </button>
          </section>
        )}

        {/* 3-Step Guide */}
        <section className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-900 transition-colors">
          <div className="text-center space-y-1">
            <h2 className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-white">How to Download MP3 in 3 Steps</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">Fast, safe, and works on any phone, tablet, or PC.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/40 space-y-2 text-center sm:text-left shadow-xs transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold font-mono text-sm mx-auto sm:mx-0 border border-emerald-500/20">
                1
              </div>
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Copy Link</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Copy the URL of any video, YouTube playlist, or Spotify playlist from YouTube, TikTok, Instagram, Facebook, or Spotify.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/40 space-y-2 text-center sm:text-left shadow-xs transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold font-mono text-sm mx-auto sm:mx-0 border border-emerald-500/20">
                2
              </div>
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Paste & Extract</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Paste the URL into the search box above and choose your preferred audio bitrate.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/40 space-y-2 text-center sm:text-left shadow-xs transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold font-mono text-sm mx-auto sm:mx-0 border border-emerald-500/20">
                3
              </div>
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Save to Device</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Click Download and the high-quality MP3 will save directly into your Downloads folder.
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/30 text-center space-y-1.5 hover:border-emerald-500/40 transition shadow-xs">
            <Headphones className="w-5 h-5 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">320kbps Audio</h4>
            <p className="text-[11px] text-zinc-500">Lossless studio sound quality</p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/30 text-center space-y-1.5 hover:border-emerald-500/40 transition shadow-xs">
            <Zap className="w-5 h-5 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Instant Speed</h4>
            <p className="text-[11px] text-zinc-500">Converts in under 2 seconds</p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/30 text-center space-y-1.5 hover:border-emerald-500/40 transition shadow-xs">
            <Smartphone className="w-5 h-5 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Phone & PC</h4>
            <p className="text-[11px] text-zinc-500">Android, iPhone, Mac, Windows</p>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/30 text-center space-y-1.5 hover:border-emerald-500/40 transition shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">100% Free</h4>
            <p className="text-[11px] text-zinc-500">No account or credit card needed</p>
          </div>
        </section>

        {/* Donation / Buy Us a Coffee Section */}
        <DonationSection />

        {/* FAQ Section (SEO Boost) */}
        <section id="faq" className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-900 transition-colors scroll-mt-20">
          <div className="text-center space-y-1">
            <h2 className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">Everything you need to know about our MP3 converter.</p>
          </div>

          <div className="space-y-2.5 max-w-3xl mx-auto pt-2">
            {[
              {
                q: 'Is this MP3 downloader completely free?',
                a: 'Yes, A2Z Fast MP3 Downloader is 100% free with unlimited conversions and no daily limits. You never need to enter credit card details or register.',
              },
              {
                q: 'Can I download MP3 on Android and iPhone?',
                a: 'Yes! On Android, the MP3 downloads straight into your device Downloads folder. On iPhone/iPad, Safari will download the audio file directly into your Files app or Music player.',
              },
              {
                q: 'What is the best bitrate for high sound quality?',
                a: 'We recommend 320 kbps for the richest, most detailed sound quality (ideal for headphones and car speakers). 192 kbps and 128 kbps are also available if you prefer smaller file sizes.',
              },
              {
                q: 'Which platforms are supported?',
                a: 'You can extract MP3 audio from YouTube, TikTok videos & sounds, Instagram Reels, Facebook videos, SoundCloud tracks, Twitter/X clips, and Reddit videos. YouTube playlists and Spotify playlist/album/track links list songs so you can download them one by one (Spotify titles are matched on YouTube).',
              },
            ].map((faq, i) => (
              <details key={i} className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/40 text-xs sm:text-sm group hover:border-zinc-300 dark:hover:border-zinc-700 transition shadow-xs">
                <summary className="font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="text-zinc-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="pt-2 text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed border-t border-zinc-200 dark:border-zinc-850 mt-2">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 py-6 text-center text-xs text-zinc-500 font-mono transition-colors">
        <p>A2Z Fast MP3 Downloader • High Fidelity Audio Conversion Protocol</p>
      </footer>
    </div>
  )
}
