'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Eye,
  Search,
  Download,
  ClipboardPaste,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Lock,
  ExternalLink,
  Share2,
  Coffee,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Heart,
  MessageCircle,
  Clock,
  Maximize2,
  Play,
  Film,
  Camera,
  Layers,
  Copy,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react'
import DonationSection from '@/components/DonationSection'

const AD_SMARTLINK = 'https://www.profitableratecpmnetwork.com/gvwaq8hih?key=3a220d2a7e229bd864d3aac504d1e304'
const openAdOnce = () => { try { window.open(AD_SMARTLINK, '_blank', 'noopener,noreferrer') } catch {} }

interface CarouselMediaItem {
  id: string
  url: string
  thumbnail: string
  type: 'image' | 'video'
  downloadUrl: string
}

interface PostItem {
  id: string
  type: 'image' | 'video' | 'carousel'
  url: string
  thumbnail: string
  caption: string
  likes: string
  comments: string
  timeAgo: string
  downloadUrl: string
  carouselMedia?: CarouselMediaItem[]
}

interface StoryItem {
  id: string
  type: 'image' | 'video'
  thumbnail: string
  url: string
  timeAgo: string
  downloadUrl: string
}

interface HighlightItem {
  id: string
  title: string
  cover: string
  storiesCount: number
}

interface ReelItem {
  id: string
  title: string
  thumbnail: string
  url: string
  views: string
  likes: string
  downloadUrl: string
}

interface ProfileData {
  platform: 'instagram' | 'tiktok' | 'snapchat' | 'facebook'
  username: string
  name: string
  avatarUrl: string
  hdAvatarUrl?: string
  bio?: string
  followers?: string
  following?: string
  postsCount?: string
  likes?: string
  subscribers?: string
  snapcodeUrl?: string
  isPrivate?: boolean
  profileUrl: string
  posts?: PostItem[]
  stories?: StoryItem[]
  highlights?: HighlightItem[]
  reels?: ReelItem[]
}

interface MediaData {
  title: string
  thumbnail: string
  downloadUrl: string
  streamUrl?: string
  audioUrl?: string
  platform: string
  fileType: 'video' | 'image' | 'audio'
  qualities?: string[]
  uploader?: string
  authorUsername?: string
  authorAvatar?: string
  caption?: string
  images?: Array<{ url: string; thumbnail?: string; title?: string }>
}

const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    color: 'from-blue-600 via-cyan-500 to-emerald-400',
    activeBg: 'bg-blue-600 text-white shadow-blue-500/20',
    placeholder: 'Paste Instagram Reel, post, carousel, or story URL…',
    helper: 'No login. Paste a public Instagram link and download. Username lookup is optional and may not show a grid.',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: 'from-cyan-400 to-pink-500',
    activeBg: 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white shadow-cyan-500/20',
    placeholder: 'Paste a public TikTok video link…',
    helper: 'Paste a public TikTok video URL. No TikTok account required.',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    color: 'from-amber-400 to-yellow-500',
    activeBg: 'bg-yellow-400 text-zinc-950 font-bold shadow-yellow-500/20',
    placeholder: 'Paste a public Snapchat spotlight or story URL…',
    helper: 'No login. Paste a public Snapchat media link. Username lookup only shows public Bitmoji when available.',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: 'from-blue-600 to-indigo-600',
    activeBg: 'bg-blue-600 text-white shadow-blue-500/20',
    placeholder: 'Paste a public Facebook reel, watch, or share URL…',
    helper: 'No login. Paste a public Facebook video/reel link. Private posts cannot be opened anonymously.',
  },
]

// Pure client-side Auto-URL Generator & Platform Detector
function getAutoUrlInfo(rawInput: string, defaultPlatform: 'instagram' | 'tiktok' | 'snapchat' | 'facebook') {
  const trimmed = (rawInput || '').trim()
  if (!trimmed) {
    return {
      platform: defaultPlatform,
      username: '',
      targetUrl: '',
      isDirectMedia: false,
      isFullUrl: false,
    }
  }

  const isHttp = /^https?:\/\//i.test(trimmed)
  if (isHttp) {
    try {
      const parsed = new URL(trimmed)
      const host = parsed.hostname.toLowerCase()

      let platform: 'instagram' | 'tiktok' | 'snapchat' | 'facebook' = defaultPlatform
      if (host.includes('tiktok.com')) platform = 'tiktok'
      else if (host.includes('facebook.com') || host.includes('fb.com') || host.includes('fb.watch')) platform = 'facebook'
      else if (host.includes('snapchat.com')) platform = 'snapchat'
      else if (host.includes('instagram.com') || host.includes('instagr.am')) platform = 'instagram'

      const isDirectMedia =
        /(?:reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/i.test(trimmed) ||
        /\/stories\/[a-zA-Z0-9_.]+/i.test(trimmed) ||
        /\/share\//i.test(trimmed) ||
        /instagram\.com\/s\/[a-zA-Z0-9_-]+/i.test(trimmed) ||
        /\/video\/\d+/i.test(trimmed) ||
        /snapchat\.com\/.*(?:spotlight|stories)/i.test(trimmed) ||
        /facebook\.com\/(?:reel|watch|share)/i.test(trimmed)

      return {
        platform,
        username: trimmed,
        targetUrl: trimmed,
        isDirectMedia,
        isFullUrl: true,
      }
    } catch {}
  }

  const cleanUser = trimmed.replace(/^@+/, '').replace(/\/+$/, '').split('?')[0].trim()
  let targetUrl = ''
  switch (defaultPlatform) {
    case 'instagram':
      targetUrl = `https://www.instagram.com/${cleanUser}/`
      break
    case 'tiktok':
      targetUrl = `https://www.tiktok.com/@${cleanUser}?lang=en`
      break
    case 'facebook':
      targetUrl = /^\d+$/.test(cleanUser)
        ? `https://www.facebook.com/profile.php?id=${cleanUser}`
        : `https://www.facebook.com/${cleanUser}`
      break
    case 'snapchat':
      targetUrl = `https://www.snapchat.com/add/${cleanUser}`
      break
    default:
      targetUrl = `https://www.instagram.com/${cleanUser}/`
  }

  return {
    platform: defaultPlatform,
    username: cleanUser,
    targetUrl,
    isDirectMedia: false,
    isFullUrl: false,
  }
}

export default function AnonymousViewerPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')
  const [activePlatform, setActivePlatform] = useState<'instagram' | 'tiktok' | 'snapchat' | 'facebook'>('instagram')
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [media, setMedia] = useState<MediaData | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Real-time Auto-URL and platform deduction
  const autoInfo = getAutoUrlInfo(query, activePlatform)

  // FastDL-style horizontal tabs: POSTS | STORIES | HIGHLIGHTS | REELS
  const [activeTab, setActiveTab] = useState<'POSTS' | 'STORIES' | 'HIGHLIGHTS' | 'REELS'>('POSTS')

  // Active slide index for multi-photo carousel posts (postId -> index)
  const [carouselIndices, setCarouselIndices] = useState<Record<string, number>>({})

  // Lightbox / Zoom Modal state (supports multi-image galleries)
  const [modalMedia, setModalMedia] = useState<{
    url: string
    title: string
    type?: string
    gallery?: Array<{ url: string; title?: string }>
    currentIndex?: number
  } | null>(null)

  // Initial load: preload default brand example so user immediately sees FastDL layout!
  useEffect(() => {
    // Check theme
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) root.classList.add('dark')
      else root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        const trimmed = text.trim()
        setQuery(trimmed)
        const auto = getAutoUrlInfo(trimmed, activePlatform)
        if (auto.platform !== activePlatform) {
          setActivePlatform(auto.platform)
        }
        if (auto.isDirectMedia || auto.isFullUrl) {
          void handleSearch(undefined, trimmed)
        }
      }
    } catch {}
  }

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault()
    const targetQuery = customQuery || query
    if (!targetQuery.trim()) return

    const auto = getAutoUrlInfo(targetQuery, activePlatform)
    const effectivePlatform = auto.platform
    if (effectivePlatform !== activePlatform) {
      setActivePlatform(effectivePlatform)
    }

    setIsSearching(true)
    setError('')
    setProfile(null)
    setMedia(null)
    if (targetQuery.includes('/stories/')) {
      setActiveTab('STORIES')
    } else if (targetQuery.includes('/reel/') || targetQuery.includes('/reels/')) {
      setActiveTab('REELS')
    } else {
      setActiveTab('POSTS')
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 28000)

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: effectivePlatform, query: targetQuery.trim() }),
        signal: controller.signal,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch this public link.')
      }

      if (data.isMedia && data.media) {
        setMedia(data.media)
      } else if (data.profile) {
        setProfile(data.profile)
      } else {
        throw new Error('No public media was returned for this link.')
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('That request took too long. Paste a public post, Reel, or story URL and try again.')
      } else {
        setError(err.message || 'Could not fetch this public link. Private accounts cannot be opened anonymously.')
      }
    } finally {
      window.clearTimeout(timeoutId)
      setIsSearching(false)
    }
  }

  // Loading state for on-demand reel resolution
  const [loadingReelId, setLoadingReelId] = useState<string | null>(null)

  // Resolve reel direct video stream if not already an MP4 URL
  const resolveReelVideo = async (reel: ReelItem): Promise<string> => {
    if (reel.downloadUrl && (reel.downloadUrl.includes('.mp4') || reel.downloadUrl.includes('/o1/v/'))) {
      return reel.downloadUrl
    }
    if (reel.url && (reel.url.includes('.mp4') || reel.url.includes('/o1/v/'))) {
      return reel.url
    }

    setLoadingReelId(reel.id)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `https://www.instagram.com/reel/${reel.id}/` }),
      })
      const data = await res.json()
      if (data.isMedia && data.media?.downloadUrl) {
        const videoUrl = data.media.downloadUrl
        if (profile?.reels) {
          const updated = profile.reels.map((r) =>
            r.id === reel.id ? { ...r, downloadUrl: videoUrl, url: videoUrl } : r
          )
          setProfile({ ...profile, reels: updated })
        }
        return videoUrl
      }
    } catch (e) {
      console.warn('[resolveReelVideo err]:', e)
    } finally {
      setLoadingReelId(null)
    }
    return reel.downloadUrl || reel.url
  }

  const handlePlayReel = async (reel: ReelItem) => {
    const videoUrl = await resolveReelVideo(reel)
    setModalMedia({
      url: videoUrl,
      title: reel.title || `Reel by @${profile?.username || 'creator'}`,
      type: 'video',
    })
  }

  const handleDownloadReel = async (reel: ReelItem) => {
    const videoUrl = await resolveReelVideo(reel)
    await handleDownload(videoUrl, `${profile?.username || 'instagram'}_reel_${reel.id}`, 'video')
  }

  const handleDownload = async (fileUrl: string, filename: string, type: 'image' | 'video' = 'image') => {
    openAdOnce() // open ad in new tab when user touches download
    try {
      const isVideo =
        type === 'video' ||
        fileUrl.includes('.mp4') ||
        fileUrl.includes('/o1/v/') ||
        fileUrl.includes('rapidcdn.app/v2')

      if (isVideo) {
        // Video download via /api/download proxy
        const res = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: fileUrl,
            downloadUrl: fileUrl,
            mediaType: 'video',
            title: filename,
          }),
        })

        if (res.ok) {
          const contentType = res.headers.get('content-type') || ''
          if (contentType.includes('application/json')) {
            const data = await res.json()
            if (data.redirectUrl) {
              const a = document.createElement('a')
              a.href = data.redirectUrl
              a.download = `${filename}.mp4`
              document.body.appendChild(a)
              a.click()
              setTimeout(() => {
                try { document.body.removeChild(a) } catch {}
              }, 1000)
              return
            }
          }
          const blob = await res.blob()
          const downloadUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = downloadUrl
          a.download = `${filename}.mp4`
          document.body.appendChild(a)
          a.click()
          setTimeout(() => {
            try {
              document.body.removeChild(a)
              URL.revokeObjectURL(downloadUrl)
            } catch {}
          }, 1000)
          return
        }
      }

      // Image download via /api/thumbnail proxy
      const res = await fetch('/api/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: fileUrl,
          title: filename,
        }),
      })

      if (res.ok) {
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const data = await res.json()
          if (data.redirectUrl) {
            window.open(data.redirectUrl, '_blank')
            return
          }
        }
        const blob = await res.blob()
        const downloadUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `${filename}.jpg`
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          try {
            document.body.removeChild(a)
            URL.revokeObjectURL(downloadUrl)
          } catch {}
        }, 1000)
      } else {
        window.open(fileUrl, '_blank')
      }
    } catch {
      window.open(fileUrl, '_blank')
    }
  }

  // Batch download all items in a carousel or gallery
  const handleDownloadAll = async (items: Array<{ url: string; filename: string }>) => {
    items.forEach((item, idx) => {
      setTimeout(() => {
        handleDownload(item.url, item.filename)
      }, idx * 450)
    })
  }

  const handleCopyLink = () => {
    if (!profile?.profileUrl) return
    navigator.clipboard.writeText(profile.profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentPlatformInfo = PLATFORMS.find((p) => p.id === activePlatform) || PLATFORMS[0]

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#0b0f14] text-zinc-900 dark:text-zinc-100 transition-colors flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#0b0f14]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Downloader</span>
            </Link>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
            <Link href="/anonymous-viewer" className="flex items-center gap-2.5 font-bold text-base tracking-tight">
              {/* Official A2Z Logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="A2Z Downloader"
                className="w-8 h-8 rounded-lg object-contain bg-zinc-950 p-0.5 border border-emerald-500/30 shadow-sm"
              />
              <span className="font-extrabold text-zinc-900 dark:text-white">
                A2Z <span className="text-blue-600 dark:text-cyan-400">Anonymous Viewer</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/mp3"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition"
            >
              <span>MP3 Fast</span>
            </Link>

            <a
              href="#donate"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Support</span>
            </a>

            {/* Theme Toggle */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-md transition ${theme === 'light' ? 'bg-white shadow text-amber-500' : 'text-zinc-400 hover:text-zinc-700'}`}
                title="Light Mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-md transition ${theme === 'dark' ? 'bg-zinc-900 shadow text-blue-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                title="Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-md transition ${theme === 'system' ? 'bg-white dark:bg-zinc-900 shadow text-cyan-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                title="System Default"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full">
        {/* Search Section */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Anonymous public downloader — paste a link, no login</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Instagram Story, Reel & Post{' '}
            <span className="text-blue-600 dark:text-cyan-400">Downloader</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Paste a public Reel, post, carousel, or story URL. No account. Preview and download when the link is public.
          </p>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {PLATFORMS.map((p) => {
            const isActive = activePlatform === p.id
            return (
              <button
                key={p.id}
                onClick={() => {
                  setActivePlatform(p.id as any)
                  setError('')
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
              >
                <span>{p.name}</span>
              </button>
            )
          })}
        </div>

        {/* Search Input Box */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg p-3 sm:p-4 mb-8 transition">
          <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  const val = e.target.value
                  setQuery(val)
                  const auto = getAutoUrlInfo(val, activePlatform)
                  if (auto.isFullUrl && auto.platform !== activePlatform) {
                    setActivePlatform(auto.platform)
                  }
                }}
                placeholder={currentPlatformInfo.placeholder}
                className="w-full pl-10 pr-20 py-3 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-1 transition cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Paste</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Search</span>
                </>
              )}
            </button>
          </form>

          {/* Dynamic Auto-Constructed URL Preview Badge */}
          {query.trim() && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs transition">
              <div className="flex items-center gap-2 truncate text-zinc-600 dark:text-zinc-300">
                <span className="font-bold text-blue-600 dark:text-cyan-400 shrink-0 flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{autoInfo.isFullUrl ? 'Direct URL:' : 'Auto-Constructed URL:'}</span>
                </span>
                <span className="truncate font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-semibold">
                  {autoInfo.targetUrl}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {autoInfo.isDirectMedia && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Direct Media
                  </span>
                )}
                {!autoInfo.isFullUrl && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 capitalize">
                    Auto {autoInfo.platform}
                  </span>
                )}
              </div>
            </div>
          )}

          <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 px-1">
            <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
            <span>{currentPlatformInfo.helper}</span>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3 mb-8">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5 text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* DIRECT MEDIA RESULT (Photos, Multi-Photo Carousels, Reels, Videos) */}
        {media && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm mb-8">
            {/* Header: Author & Platform Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                {media.authorAvatar && (
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/thumbnail?url=${encodeURIComponent(media.authorAvatar)}`}
                      alt={media.uploader || 'Creator'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-zinc-900 dark:text-white">
                      {media.uploader || 'Instagram Media'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
                      {media.images && media.images.length > 1
                        ? `Carousel (${media.images.length} Photos)`
                        : media.fileType === 'video'
                        ? 'Video / Reel'
                        : 'Photo'}
                    </span>
                  </div>
                  {media.authorUsername && (
                    <button
                      onClick={() => {
                        setQuery(media.authorUsername!)
                        handleSearch(undefined, media.authorUsername)
                      }}
                      className="text-xs text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 mt-0.5 font-medium cursor-pointer"
                    >
                      <span>@{media.authorUsername}</span>
                      <ExternalLink className="w-3 h-3" />
                      <span className="text-zinc-400">· View Full Profile</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Download All button if carousel */}
              {media.images && media.images.length > 1 && (
                <button
                  onClick={() =>
                    handleDownloadAll(
                      media.images!.map((img, idx) => ({
                        url: img.url,
                        filename: `instagram_${media.authorUsername || 'post'}_photo_${idx + 1}`,
                      }))
                    )
                  }
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer self-start sm:self-auto"
                >
                  <Download className="w-4 h-4" />
                  <span>Download All ({media.images.length} Photos)</span>
                </button>
              )}
            </div>

            {/* Caption */}
            {media.caption && (
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                {media.caption}
              </p>
            )}

            {/* Gallery of Images (If Carousel / Multi-Photo) */}
            {media.images && media.images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {media.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl overflow-hidden shadow-sm flex flex-col group"
                  >
                    <div className="relative aspect-square w-full bg-zinc-900 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/thumbnail?url=${encodeURIComponent(img.thumbnail || img.url)}`}
                        alt={img.title || `Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-sm">
                        {idx + 1} / {media.images!.length}
                      </span>
                      <button
                        onClick={() =>
                          setModalMedia({
                            url: img.url,
                            title: `${media.uploader || 'Instagram'} - ${img.title || `Photo ${idx + 1}`}`,
                            type: 'image',
                            gallery: media.images,
                            currentIndex: idx,
                          })
                        }
                        className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition cursor-pointer"
                        title="Expand Image"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold">{img.title || `Photo ${idx + 1}`}</span>
                        <span className="text-emerald-500 font-bold">1080p Original</span>
                      </div>
                      <button
                        onClick={() =>
                          handleDownload(img.url, `instagram_${media.authorUsername || 'post'}_photo_${idx + 1}`)
                        }
                        className="w-full py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Photo {idx + 1}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Single Video or Image */
              <div className="max-w-md mx-auto bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="relative aspect-square w-full bg-zinc-900 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/thumbnail?url=${encodeURIComponent(media.thumbnail || media.downloadUrl)}`}
                    alt={media.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {media.fileType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <button
                    onClick={() => handleDownload(media.downloadUrl, `instagram_media`)}
                    className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {media.fileType === 'video' ? '1080p Video' : 'Original Photo'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROFILE HEADER & FASTDL-STYLE RESULT (Matches User Screenshot Image 1 & 2) */}
        {profile && (
          <div className="space-y-6">
            {/* Top Profile Summary (Matches Image 2) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 transition shadow-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Round Avatar with Expand button on bottom-right */}
                <div className="relative shrink-0">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/thumbnail?url=${encodeURIComponent(profile.hdAvatarUrl || profile.avatarUrl)}`}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Expand button (matches dark blue circular icon in image 2) */}
                  <button
                    onClick={() =>
                      setModalMedia({
                        url: profile.hdAvatarUrl || profile.avatarUrl,
                        title: `${profile.username} Full HD Profile Picture`,
                        type: 'image',
                      })
                    }
                    className="absolute bottom-1 right-1 p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition cursor-pointer"
                    title="Zoom & View Full HD Avatar"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Handle, Stats, Name & Bio */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <a
                      href={profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white hover:text-blue-600 flex items-center justify-center sm:justify-start gap-1.5 transition"
                    >
                      <span>@{profile.username}</span>
                      <ExternalLink className="w-4 h-4 text-zinc-400" />
                    </a>
                  </div>

                  {/* Follower Stats Row (Customized per platform) */}
                  <div className="flex items-center justify-center sm:justify-start gap-6 py-1">
                    {profile.platform === 'tiktok' ? (
                      <>
                        {profile.followers && (
                          <div>
                            <span className="font-bold text-base text-zinc-900 dark:text-white">
                              {profile.followers}
                            </span>{' '}
                            <span className="text-xs text-zinc-500">followers</span>
                          </div>
                        )}
                        {profile.following && (
                          <div>
                            <span className="font-bold text-base text-zinc-900 dark:text-white">
                              {profile.following}
                            </span>{' '}
                            <span className="text-xs text-zinc-500">following</span>
                          </div>
                        )}
                        {profile.likes && (
                          <div>
                            <span className="font-bold text-base text-zinc-900 dark:text-white">
                              {profile.likes}
                            </span>{' '}
                            <span className="text-xs text-zinc-500">likes</span>
                          </div>
                        )}
                      </>
                    ) : profile.platform === 'snapchat' ? (
                      <>
                        {profile.subscribers && (
                          <div>
                            <span className="font-bold text-base text-zinc-900 dark:text-white">
                              {profile.subscribers}
                            </span>{' '}
                            <span className="text-xs text-zinc-500">subscribers</span>
                          </div>
                        )}
                        {profile.snapcodeUrl && (
                          <a
                            href={profile.snapcodeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-yellow-500 font-bold hover:underline flex items-center gap-1"
                          >
                            <span>Snapcode</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </>
                    ) : profile.platform === 'facebook' ? (
                      <>
                        {profile.followers && (
                          <div>
                            <span className="font-bold text-base text-zinc-900 dark:text-white">
                              {profile.followers}
                            </span>{' '}
                            <span className="text-xs text-zinc-500">followers</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {profile.postsCount && (
                          <div>
                            <span className="font-bold text-base text-zinc-900 dark:text-white">
                              {profile.postsCount}
                            </span>{' '}
                            <span className="text-xs text-zinc-500">posts</span>
                          </div>
                        )}
                        {profile.followers && (
                          <div>
                            <span className="font-bold text-base text-zinc-900 dark:text-white">
                              {profile.followers}
                            </span>{' '}
                            <span className="text-xs text-zinc-500">followers</span>
                          </div>
                        )}
                        {profile.following && (
                          <div>
                            <span className="font-bold text-base text-zinc-900 dark:text-white">
                              {profile.following}
                            </span>{' '}
                            <span className="text-xs text-zinc-500">following</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Full Name */}
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">{profile.name}</h3>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-line max-w-xl">
                      {profile.bio}
                    </p>
                  )}

                  {/* FastDL-Style Direct Link Helper */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 mt-3">
                    <div className="space-y-0.5 text-center sm:text-left">
                      <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span>Download Any Reel, Carousel or Post in 1080p</span>
                      </h4>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        Copy any Post or Reel link from @{profile.username} and paste it into the search bar above to view & download in full resolution!
                      </p>
                    </div>
                    <button
                      onClick={handlePaste}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 flex items-center gap-1.5 shrink-0 cursor-pointer transition"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Paste Link</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Horizontal Tabs: POSTS | STORIES | HIGHLIGHTS | REELS (Matches Image 2) */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 mt-6 pt-4">
                <div className="flex items-center justify-around sm:justify-start sm:gap-12 text-xs sm:text-sm font-bold tracking-wider">
                  <button
                    onClick={() => setActiveTab('POSTS')}
                    className={`pb-2 transition cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'POSTS'
                        ? 'border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>POSTS</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('STORIES')}
                    className={`pb-2 transition cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'STORIES'
                        ? 'border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>STORIES</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('HIGHLIGHTS')}
                    className={`pb-2 transition cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'HIGHLIGHTS'
                        ? 'border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>HIGHLIGHTS</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('REELS')}
                    className={`pb-2 transition cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'REELS'
                        ? 'border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>REELS</span>
                  </button>
                </div>
              </div>
            </div>

            {/* TAB 1: POSTS GRID (Matches User Screenshot Image 1 & Image 2) */}
            {activeTab === 'POSTS' && (
              <>
                {!profile.posts || profile.posts.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-full bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                      Direct Reel & Post Downloader Ready
                    </h3>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                      To download any Carousel, Reel, or Post from @{profile.username} in full uncompressed 1080p HD, paste its direct link into the search bar above!
                    </p>
                    <button
                      onClick={handlePaste}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 inline-flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Paste Post/Reel Link</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {(profile.posts || []).map((post) => {
                  const hasCarousel = Boolean(post.carouselMedia && post.carouselMedia.length > 1)
                  const curSlideIdx = hasCarousel ? carouselIndices[post.id] || 0 : 0
                  const currentSlide = hasCarousel ? post.carouselMedia![curSlideIdx] : null
                  const displayUrl = currentSlide ? currentSlide.url : post.url
                  const displayThumb = currentSlide ? currentSlide.thumbnail : post.thumbnail
                  const downloadTarget = currentSlide ? currentSlide.downloadUrl : post.downloadUrl

                  return (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                    >
                      {/* Image Container with Carousel Controls & Expand Icon */}
                      <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/thumbnail?url=${encodeURIComponent(displayThumb || displayUrl)}`}
                          alt={post.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          referrerPolicy="no-referrer"
                        />

                        {/* Carousel Slide Badge */}
                        {hasCarousel && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-sm flex items-center gap-1.5 shadow-sm">
                            <Layers className="w-3.5 h-3.5" />
                            <span>{curSlideIdx + 1} / {post.carouselMedia!.length}</span>
                          </span>
                        )}

                        {/* Prev Slide Arrow */}
                        {hasCarousel && curSlideIdx > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setCarouselIndices((prev) => ({ ...prev, [post.id]: curSlideIdx - 1 }))
                            }}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition cursor-pointer shadow-md"
                            title="Previous Photo"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        )}

                        {/* Next Slide Arrow */}
                        {hasCarousel && curSlideIdx < post.carouselMedia!.length - 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setCarouselIndices((prev) => ({ ...prev, [post.id]: curSlideIdx + 1 }))
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition cursor-pointer shadow-md"
                            title="Next Photo"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}

                        {/* Indicator Dots for Carousel */}
                        {hasCarousel && (
                          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
                            {post.carouselMedia!.map((_, dIdx) => (
                              <div
                                key={dIdx}
                                className={`h-1.5 rounded-full transition-all ${
                                  dIdx === curSlideIdx ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Expand Button */}
                        <button
                          onClick={() =>
                            setModalMedia({
                              url: displayUrl,
                              title: post.caption,
                              type: post.type,
                              gallery: hasCarousel ? post.carouselMedia : undefined,
                              currentIndex: curSlideIdx,
                            })
                          }
                          className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition cursor-pointer"
                          title="Expand Image"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Content Section */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        {/* Caption */}
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                          {post.caption}
                        </p>

                        {/* Action Buttons: Download Current Slide & Download All Carousel Photos */}
                        <div className="space-y-2">
                          <button
                            onClick={() =>
                              handleDownload(
                                downloadTarget,
                                `${profile.username}_post_${post.id}${hasCarousel ? `_photo_${curSlideIdx + 1}` : ''}`
                              )
                            }
                            className="w-full py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                            <span>
                              {hasCarousel
                                ? `Download Photo (${curSlideIdx + 1}/${post.carouselMedia!.length})`
                                : 'Download'}
                            </span>
                          </button>

                          {hasCarousel && (
                            <button
                              onClick={() =>
                                handleDownloadAll(
                                  post.carouselMedia!.map((m, mIdx) => ({
                                    url: m.downloadUrl,
                                    filename: `${profile.username}_post_${post.id}_photo_${mIdx + 1}`,
                                  }))
                                )
                              }
                              className="w-full py-2 rounded-xl font-bold text-xs bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Download All ({post.carouselMedia!.length} Photos)</span>
                            </button>
                          )}
                        </div>

                        {/* Meta Footer (Matches Image 1: "❤️ 19m  💬 1m   🕒 3 weeks ago") */}
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 pt-1">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{post.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{post.comments}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{post.timeAgo}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

            {/* TAB 2: STORIES */}
            {activeTab === 'STORIES' && (
              <>
                {profile.stories && profile.stories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {profile.stories.map((story) => (
                      <div
                        key={story.id}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col cursor-pointer group"
                        onClick={() =>
                          setModalMedia({
                            url: story.url,
                            title: `Story from @${profile.username}`,
                            type: story.type,
                          })
                        }
                      >
                        <div className="relative aspect-[9/16] w-full bg-zinc-950 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/thumbnail?url=${encodeURIComponent(story.thumbnail)}`}
                            alt="Story"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md uppercase tracking-wider">
                            Active Story
                          </span>

                          {story.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition">
                              <div className="w-14 h-14 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                                <Play className="w-6 h-6 fill-white ml-0.5" />
                              </div>
                            </div>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setModalMedia({
                                url: story.url,
                                title: `Story from @${profile.username}`,
                                type: story.type,
                              })
                            }}
                            className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition cursor-pointer"
                            title="Expand Story"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="flex items-center justify-between text-xs text-zinc-400">
                            <span>Uploaded {story.timeAgo}</span>
                            <span className="text-emerald-500 font-semibold">Expires in 24h</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(
                                story.downloadUrl,
                                `${profile.username}_story_${story.id}`,
                                story.type
                              )
                            }}
                            className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download {story.type === 'video' ? 'Video Story (.mp4)' : 'Story Photo'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-md flex items-center justify-center">
                      <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center">
                        <Clock className="w-7 h-7 text-zinc-400" />
                      </div>
                    </div>
                    <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                      No Active Stories Right Now
                    </h3>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                      @{profile.username} has not posted any public stories in the last 24 hours, or their stories have expired. Check back when they post new updates!
                    </p>
                  </div>
                )}
              </>
            )}

            {/* TAB 3: HIGHLIGHTS */}
            {activeTab === 'HIGHLIGHTS' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {(profile.highlights || []).map((hl) => (
                  <div
                    key={hl.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center space-y-3 shadow-sm hover:shadow-md transition"
                  >
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-blue-500/30 p-1 bg-gradient-to-tr from-blue-600 to-cyan-400">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/thumbnail?url=${encodeURIComponent(hl.cover)}`}
                        alt={hl.title}
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{hl.title}</h4>
                      <p className="text-[11px] text-zinc-400">{hl.storiesCount} Stories</p>
                    </div>
                    <button
                      onClick={() => handleDownload(hl.cover, `${profile.username}_highlight_${hl.id}`)}
                      className="w-full py-2 rounded-xl font-bold text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: REELS */}
            {activeTab === 'REELS' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {(profile.reels || []).map((reel) => (
                  <div
                    key={reel.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col cursor-pointer group"
                    onClick={() => handlePlayReel(reel)}
                  >
                    <div className="relative aspect-[9/16] w-full bg-zinc-950 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/thumbnail?url=${encodeURIComponent(reel.thumbnail)}`}
                        alt={reel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition">
                        <div className="w-14 h-14 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                          {loadingReelId === reel.id ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Play className="w-6 h-6 fill-white ml-0.5" />
                          )}
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 text-[11px] font-bold text-white bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <Film className="w-3 h-3" />
                        <span>{reel.views} Views</span>
                      </div>
                      <div className="absolute top-3 right-3 text-[11px] font-bold text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md">
                        1080p Full HD
                      </div>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-relaxed">
                        {reel.title}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadReel(reel)
                        }}
                        disabled={loadingReelId === reel.id}
                        className="w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                      >
                        {loadingReelId === reel.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Loading 1080p Video...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Download 1080p Reel</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LIGHTBOX / VIDEO PLAYER MODAL */}
        {modalMedia && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50 duration-200"
            onClick={() => setModalMedia(null)}
          >
            <div
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalMedia(null)}
                className="absolute top-2 right-2 sm:-top-10 sm:right-0 p-2 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition z-10 cursor-pointer shadow-md"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative w-full max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl bg-zinc-950">
                {modalMedia.type === 'video' ? (
                  <video
                    src={modalMedia.url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain bg-black shadow-2xl"
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/thumbnail?url=${encodeURIComponent(modalMedia.url)}`}
                    alt={modalMedia.title}
                    className="max-h-[75vh] w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Modal Gallery Prev Button */}
                {modalMedia.gallery && (modalMedia.currentIndex ?? 0) > 0 && (
                  <button
                    onClick={() => {
                      const newIdx = (modalMedia.currentIndex ?? 0) - 1
                      const item = modalMedia.gallery![newIdx]
                      setModalMedia({
                        ...modalMedia,
                        url: item.url,
                        currentIndex: newIdx,
                      })
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white transition cursor-pointer shadow-lg"
                    title="Previous Photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Modal Gallery Next Button */}
                {modalMedia.gallery && (modalMedia.currentIndex ?? 0) < modalMedia.gallery.length - 1 && (
                  <button
                    onClick={() => {
                      const newIdx = (modalMedia.currentIndex ?? 0) + 1
                      const item = modalMedia.gallery![newIdx]
                      setModalMedia({
                        ...modalMedia,
                        url: item.url,
                        currentIndex: newIdx,
                      })
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black text-white transition cursor-pointer shadow-lg"
                    title="Next Photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                {/* Modal Gallery Pill */}
                {modalMedia.gallery && modalMedia.gallery.length > 1 && (
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-black/70 text-white backdrop-blur-sm shadow-md">
                    Photo {(modalMedia.currentIndex ?? 0) + 1} of {modalMedia.gallery.length}
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() =>
                    handleDownload(
                      modalMedia.url,
                      `instagram_${modalMedia.type === 'video' ? 'video' : 'photo'}_${Date.now()}`,
                      modalMedia.type === 'video' ? 'video' : 'image'
                    )
                  }
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg flex items-center gap-2 cursor-pointer transition"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    Download {modalMedia.type === 'video' ? '1080p MP4 Video' : 'Full Resolution Photo'}
                  </span>
                </button>

                {modalMedia.gallery && modalMedia.gallery.length > 1 && (
                  <button
                    onClick={() =>
                      handleDownloadAll(
                        modalMedia.gallery!.map((g, gIdx) => ({
                          url: g.url,
                          filename: `carousel_photo_${gIdx + 1}`,
                        }))
                      )
                    }
                    className="px-6 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center gap-2 cursor-pointer transition"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Download All ({modalMedia.gallery.length} Photos)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-12">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center mb-3">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">100% Anonymous & Private</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              No account login required. Stalk any public profile, story, or reel without leaving view receipts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Original 1080p Quality</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Download photos, carousels, and reels in maximum uncompressed resolution directly to your camera roll.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">All Social Platforms</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Supports Instagram, TikTok, Snapchat, and Facebook profiles with instant 1-click downloads.
            </p>
          </div>
        </div>

        {/* SEO FAQ Section */}
        <section className="my-14 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-900/50">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Frequently Asked Questions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Everything You Need to Know About Anonymous Instagram Viewer
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
              Learn how A2Z Downloader lets you watch Instagram stories, inspect full HD profile pictures, and download reels 100% privately without leaving any footprints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                <span>Can someone see if I view their story?</span>
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                No. All stories and profile content are requested server-side using secure proxies without attaching your account info. The user will never see your name or account in their story view count or list.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Do I need to sign in with an account?</span>
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Zero login required. You do not need to enter your Instagram password, register, or link any social account. Just enter any public username or link to browse instantly.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>Can I download 1080p Reels & Carousels?</span>
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Yes! Our viewer allows you to preview videos in a built-in player, download reels as high-definition MP4 files, and batch-download entire photo carousels in their original resolution.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Monitor className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Does this work on mobile and desktop?</span>
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Yes. A2Z Downloader works seamlessly on iOS (iPhone Safari), Android, Mac, iPad, and Windows browsers without requiring any third-party app downloads.
              </p>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <div id="donate" className="scroll-mt-20">
          <DonationSection />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 bg-white dark:bg-zinc-950 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 A2Z Downloader. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-white transition">
              Home Downloader
            </Link>
            <Link href="/mp3" className="hover:text-zinc-900 dark:hover:text-white transition">
              MP3 Fast
            </Link>
            <Link href="/anonymous-viewer" className="hover:text-zinc-900 dark:hover:text-white transition">
              Anonymous Viewer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
