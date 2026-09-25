'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Download,
  Film,
  Music,
  Image as ImageIcon,
  Clock,
  User,
  Check,
  Lock,
  Coins,
  ExternalLink,
  Play,
  Tv,
  HardDrive,
  QrCode,
  Smartphone,
  Scissors,
  Sparkles,
  AlertTriangle,
  Monitor,
  Coffee,
} from 'lucide-react'

import MediaEnhancer, { EnhancementSettings } from './MediaEnhancer'
import QrModal from './QrModal'
import { extractYouTubeVideoId } from '@/lib/downloader/client-utils'

export interface AnalyzedMedia {
  title: string
  thumbnail: string
  duration?: string
  durationSeconds?: number
  uploader?: string
  platform: string
  originalUrl: string
  qualities?: string[]
  isDirectFile?: boolean
  fileType?: 'video' | 'audio' | 'image'
  streamUrl?: string
  downloadUrl?: string
  audioUrl?: string
  isDirectMovie?: boolean
  fileSize?: string
  formats?: Array<{ quality?: string | number; label?: string; url: string; type?: string }>
  images?: Array<{ url: string; thumbnail?: string; title?: string }>
}

interface MediaCardProps {
  media: AnalyzedMedia
  tokens: number
  guestDownloadsLeft: number
  isLoggedIn: boolean
  onDownload: (
    format: string,
    type: 'video' | 'audio' | 'image',
    enhancement: EnhancementSettings,
    downloadUrl?: string
  ) => void
  isDownloading: boolean
  onRequireAuth: (reason: '4k' | 'limit') => void
  onRequireTokens: () => void
  onOpenEnhance?: () => void
}

export default function MediaCard({
  media,
  tokens,
  guestDownloadsLeft,
  isLoggedIn,
  onDownload,
  isDownloading,
  onRequireAuth,
  onRequireTokens,
  onOpenEnhance,
}: MediaCardProps) {
  const defaultTab = media.isDirectMovie ? 'watch' : media.fileType || 'video'
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'image' | 'watch'>(defaultTab)
  const [isQrOpen, setIsQrOpen] = useState(false)

  const availableQualities =
    media.qualities && media.qualities.length > 0
      ? media.qualities.filter(q => q !== 'Audio Only')
      : ['1080p Full HD', '720p HD', 'Standard']

  const [selectedQuality, setSelectedQuality] = useState<string>(
    availableQualities.includes('1080p Full HD')
      ? '1080p Full HD'
      : availableQualities.includes('1080p')
      ? '1080p'
      : availableQualities[0] || '720p HD'
  )

  const [enhancement, setEnhancement] = useState<EnhancementSettings>({
    enabled: false,
    trimEnabled: false,
    trimStart: 0,
    trimEnd: media.durationSeconds || 240,
    compressionLevel: 'original',
    targetFormat: activeTab === 'audio' ? 'mp3' : 'mp4',
    audioBitrate: '320k',
    normalizeAudio: false,
    muteAudio: false,
  })

  const getTokenCost = () => {
    if (activeTab === 'audio' || activeTab === 'image') return 0
    if (selectedQuality === '4K' || selectedQuality.includes('4K')) return 10
    if (selectedQuality.includes('1080p')) return 5
    return 2
  }

  const [showRedNotice, setShowRedNotice] = useState(false)

  const isHeavyDownload =
    activeTab === 'video' &&
    (selectedQuality.includes('4K') ||
      selectedQuality.includes('2K') ||
      selectedQuality.includes('1440p') ||
      selectedQuality.includes('2160p') ||
      (!enhancement.trimEnabled && (media.durationSeconds || 0) > 300))

  const tokenCost = getTokenCost()
  const isFreeTrialApplicable = true
  const canAfford = true

  const handleDownloadClick = () => {
    if (isHeavyDownload) {
      setShowRedNotice(true)
    }

    const downloadType =
      activeTab === 'audio' ? 'audio' : activeTab === 'image' || media.fileType === 'image' ? 'image' : 'video'

    if (activeTab === 'image' && media.images && media.images.length > 1) {
      media.images.forEach((img, i) => {
        setTimeout(() => {
          onDownload('original', 'image', enhancement, img.url)
        }, i * 350)
      })
      return
    }

    let targetUrl = media.downloadUrl
    if (activeTab === 'audio') {
      const audioFormat = media.formats?.find(f => f.type === 'audio' || (f.label && f.label.toLowerCase().includes('mp3')))
      targetUrl = audioFormat?.url || media.audioUrl || media.downloadUrl
    } else if (activeTab === 'image') {
      targetUrl = (media.fileType === 'image' ? (media.downloadUrl || media.thumbnail) : media.thumbnail) || media.thumbnail
    } else if (media.formats && media.formats.length > 0) {
      const cleanQ = selectedQuality.replace(/[^\d]/g, '')
      const match = media.formats.find(
        f => (f.type !== 'audio') && (f.label === selectedQuality || (f.quality && cleanQ && String(f.quality) === cleanQ))
      )
      if (match?.url) {
        targetUrl = match.url
      }
    }

    onDownload(
      activeTab === 'video' || activeTab === 'watch' ? selectedQuality : activeTab === 'audio' ? 'mp3' : 'original',
      downloadType,
      enhancement,
      targetUrl
    )
  }

  const handleDownload60sClip = () => {
    const clipStart = enhancement.trimEnabled ? enhancement.trimStart : 0
    const clipEnd = enhancement.trimEnabled
      ? enhancement.trimEnd
      : Math.min(media.durationSeconds || 60, 60)
    let targetUrl = media.downloadUrl
    if (media.formats && media.formats.length > 0) {
      const cleanQ = selectedQuality.replace(/[^\d]/g, '')
      const match = media.formats.find(
        f =>
          f.type !== 'audio' &&
          (f.label === selectedQuality || (f.quality && cleanQ && String(f.quality) === cleanQ))
      )
      if (match?.url) targetUrl = match.url
    }

    onDownload(
      selectedQuality,
      'video',
      {
        ...enhancement,
        enabled: true,
        trimEnabled: true,
        trimStart: clipStart,
        trimEnd: clipEnd,
        targetFormat: 'mp4',
      },
      targetUrl
    )
  }

  const ytVideoId = extractYouTubeVideoId(media.originalUrl || media.streamUrl || '')
  const hasPlayableStream = Boolean(ytVideoId || media.streamUrl || media.downloadUrl)


  return (
    <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 sm:p-5 shadow-lg space-y-4 sm:space-y-5 animate-in fade-in-50 duration-200">
      {/* Top Media Header: Thumbnail + Details */}
      <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-start">
        {/* Media Thumbnail */}
        <div className="relative w-full sm:w-48 aspect-video sm:aspect-auto sm:h-28 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
          {media.thumbnail ? (
            <img
              src={`/api/thumbnail?url=${encodeURIComponent(media.thumbnail)}`}
              alt={media.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400 gap-1.5 p-4">
              <Tv className="w-8 h-8 opacity-40" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Video Stream</span>
            </div>
          )}

          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono uppercase tracking-wider font-semibold">
            {media.platform}
          </div>

          {media.duration && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {media.duration}
            </div>
          )}
        </div>

        {/* Media Details */}
        <div className="flex-1 min-w-0 space-y-1.5 w-full">
          <h2 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
            {media.title}
          </h2>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-zinc-500 font-mono">
            {media.uploader && (
              <span className="flex items-center gap-1 truncate max-w-[150px]">
                <User className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="truncate">{media.uploader}</span>
              </span>
            )}
            {media.fileSize && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <HardDrive className="w-3 h-3 shrink-0" />
                  {media.fileSize}
                </span>
              </>
            )}
            <span>•</span>
            <a
              href={media.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition truncate max-w-[120px] sm:max-w-[180px]"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              Source
            </a>
          </div>

          <div className="pt-1.5 flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
              {media.isDirectMovie ? 'Direct Movie Stream' : 'Universal Media Engine'}
            </span>
            {hasPlayableStream && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <Play className="w-2.5 h-2.5 fill-current" />
                Watchable in Browser
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsQrOpen(true)}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition cursor-pointer"
              title="Scan QR code to open & download on your phone"
            >
              <QrCode className="w-3 h-3 text-emerald-500" />
              <span>Send to Phone</span>
            </button>
            {media.fileType !== 'image' && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenEnhance) {
                    onOpenEnhance()
                  } else {
                    setEnhancement(prev => ({
                      ...prev,
                      enabled: true,
                      trimEnabled: true,
                      trimStart: 0,
                      trimEnd: Math.min(media.durationSeconds || 60, 60),
                    }))
                  }
                }}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 transition cursor-pointer border ${
                  enhancement.trimEnabled
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                }`}
                title="Trim a short clip or audio ringtone (Media Clip)"
              >
                <Scissors className="w-3 h-3" />
                <span>✂️ Media Clip</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Video, Watch/Stream, Audio, Cover */}
      <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 text-[11px] sm:text-xs font-medium">
        {/* Watch Movie Tab */}
        {media.fileType !== 'image' && hasPlayableStream && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('watch')
            }}
            className={`flex-1 py-2 px-1 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition touch-manipulation cursor-pointer ${
              activeTab === 'watch'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Play className="w-3.5 h-3.5 shrink-0 fill-current" />
            <span>Watch / Stream</span>
          </button>
        )}

        {media.fileType !== 'image' && (
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-2 px-1 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition touch-manipulation cursor-pointer ${
              activeTab === 'video'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Film className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">Video</span>
            <span className="hidden sm:inline">Video Download</span>
          </button>
        )}

        {media.fileType !== 'image' && (
          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-2 px-1 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition touch-manipulation cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Music className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">Audio</span>
            <span className="hidden sm:inline">Audio Only</span>
            <span className="text-[9px] sm:text-[10px] font-mono px-1 rounded-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
              FREE
            </span>
          </button>
        )}

        {(media.thumbnail || media.fileType === 'image' || (media.images && media.images.length > 0)) && (
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-2 px-1 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition touch-manipulation cursor-pointer ${
              activeTab === 'image'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">
              {media.images && media.images.length > 1
                ? `Images (${media.images.length})`
                : media.fileType === 'image'
                ? 'Image'
                : 'Cover'}
            </span>
            <span className="hidden sm:inline">
              {media.images && media.images.length > 1
                ? `All Images (${media.images.length})`
                : media.fileType === 'image'
                ? 'Image (HD)'
                : 'Cover Image'}
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono px-1 rounded-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
              FREE
            </span>
          </button>
        )}

        {onOpenEnhance && (
          <button
            type="button"
            onClick={onOpenEnhance}
            className="flex-1 py-2 px-1 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition touch-manipulation cursor-pointer text-zinc-500 hover:text-cyan-500 hover:bg-cyan-500/10 font-medium"
            title="Clip & Enhance Video"
          >
            <Scissors className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
            <span className="sm:hidden">Clip</span>
            <span className="hidden sm:inline">Enhance</span>
          </button>
        )}
      </div>

      {/* High-Definition In-Browser Streaming Player (Zero Buffering Edge Player - Direct CDN Offload) */}
      {activeTab === 'watch' && (
        <div className="space-y-3 animate-in fade-in-50 duration-200">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-zinc-200 dark:border-zinc-800 shadow-inner">
            <video
              src={
                (media.streamUrl && media.streamUrl.startsWith('http') && !media.streamUrl.includes('youtube.com') && !media.streamUrl.includes('youtu.be'))
                  ? media.streamUrl
                  : (media.downloadUrl && media.downloadUrl.startsWith('http') && !media.downloadUrl.includes('youtube.com'))
                  ? media.downloadUrl
                  : `/api/stream-proxy?url=${encodeURIComponent(media.streamUrl || media.downloadUrl || media.originalUrl)}&quality=stream`
              }
              controls
              playsInline
              className="w-full h-full object-contain"
              poster={media.thumbnail ? `/api/thumbnail?url=${encodeURIComponent(media.thumbnail)}` : undefined}
            >
              Your browser does not support HTML5 video playback.
            </video>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500 font-mono px-1">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Direct CDN High-Speed Stream
            </span>
            {media.fileSize && <span>File Size: {media.fileSize}</span>}
          </div>
        </div>
      )}

      {/* Video Quality Selection Grid */}
      {(activeTab === 'video' || activeTab === 'watch') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              Select Download Resolution
            </span>
            <span className="text-zinc-400 text-[10px] sm:text-[11px] font-mono">
              MP4 High Bitrate
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableQualities.map(q => {
              const isSelected = selectedQuality === q
              const is4K = q.includes('4K')
              const cost = is4K ? 10 : q.includes('1080p') ? 5 : 2

              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSelectedQuality(q)}
                  className={`p-2.5 sm:p-3 rounded-xl border text-left transition relative touch-manipulation cursor-pointer min-h-[52px] ${
                    isSelected
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900 shadow-xs ring-1 ring-zinc-900 dark:ring-zinc-100'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {q}
                    </span>
                    {isSelected && (
                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-1">
                    {is4K ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-mono font-medium text-amber-600 dark:text-amber-400">
                        <Lock className="w-2.5 h-2.5" /> 10T (Login)
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500">
                        {guestDownloadsLeft > 0 ? 'Free / ' : ''}
                        {cost} Tokens
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'audio' && (
        <div className="p-3 sm:p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs flex items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
              Audio Extraction (MP3 320 kbps)
            </span>
            <span className="text-zinc-500 text-[10px] sm:text-[11px]">
              Studio stereo audio • 100% Free & Unlimited
            </span>
          </div>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md text-[11px] sm:text-xs shrink-0">
            0 Tokens
          </span>
        </div>
      )}

      {activeTab === 'image' && media.images && media.images.length > 1 ? (
        <div className="space-y-3 animate-in fade-in-50 duration-200">
          <div className="p-3 sm:p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                Gallery Album ({media.images.length} High-Res Photos)
              </span>
              <span className="text-zinc-500 text-[10px] sm:text-[11px]">
                Original resolution pictures • Click any image to download individually or download all below
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                media.images?.forEach((img, i) => {
                  setTimeout(() => {
                    onDownload('original', 'image', enhancement, img.url)
                  }, i * 350)
                })
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer touch-manipulation"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download All ({media.images.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-96 overflow-y-auto p-1">
            {media.images.map((img, idx) => (
              <div
                key={idx}
                className="group relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
              >
                <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <img
                    src={`/api/thumbnail?url=${encodeURIComponent(img.thumbnail || img.url)}`}
                    alt={img.title || `Photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
                    #{idx + 1}
                  </span>
                </div>
                <div className="p-2 flex items-center justify-between gap-1 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
                    Photo {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDownload('original', 'image', enhancement, img.url)}
                    className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white text-zinc-700 dark:text-zinc-300 transition cursor-pointer shrink-0"
                    title={`Download Photo ${idx + 1}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'image' && (media.thumbnail || media.downloadUrl) ? (
        <div className="p-3 sm:p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs flex items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
              High Resolution Image
            </span>
            <span className="text-zinc-500 text-[10px] sm:text-[11px]">
              Original source picture • Unlimited downloads
            </span>
          </div>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md text-[11px] sm:text-xs shrink-0">
            0 Tokens
          </span>
        </div>
      ) : null}

      {/* Optional Media Enhancement Studio */}
      <MediaEnhancer
        mediaType={activeTab === 'audio' ? 'audio' : 'video'}
        durationSeconds={media.durationSeconds || 180}
        settings={enhancement}
        onChange={setEnhancement}
      />

      {/* Download Button */}
      <div className="pt-1 space-y-2">
        <button
          onClick={handleDownloadClick}
          disabled={isDownloading}
          className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[48px]"
        >
          {isDownloading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>
                {enhancement.trimEnabled
                  ? 'Generating & saving clip to device...'
                  : 'Fetching download stream...'}
              </span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>
                Download{' '}
                {enhancement.trimEnabled
                  ? activeTab === 'audio' || enhancement.targetFormat === 'mp3'
                    ? `${Math.round(Math.max(1, enhancement.trimEnd - enhancement.trimStart))}s Ringtone (MP3)`
                    : `${Math.round(Math.max(1, enhancement.trimEnd - enhancement.trimStart))}s Video Clip (${(enhancement.targetFormat || 'mp4').toUpperCase()})`
                  : activeTab === 'image' || media.fileType === 'image'
                  ? media.images && media.images.length > 1
                    ? `All ${media.images.length} High-Res Images`
                    : 'High-Res Image'
                  : activeTab === 'video' || activeTab === 'watch'
                  ? media.isDirectMovie
                    ? 'Movie File'
                    : `${selectedQuality} Video`
                  : 'Audio MP3'}
                {' (Free)'}
              </span>
            </>
          )}
        </button>

        {/* Friendly High-Quality Guidance Card for 4K / 2K & Large Files */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => setShowRedNotice(!showRedNotice)}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border transition cursor-pointer ${
              isHeavyDownload
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                {isHeavyDownload
                  ? '💡 4K / 2K Ultra HD High Quality Notice'
                  : '💡 Original High Quality (4K / 2K) Notice'}
              </span>
            </span>
            <span className="text-[11px] underline">
              {showRedNotice || isHeavyDownload ? 'Hide' : 'Want Original 4K/2K?'}
            </span>
          </button>

          {(showRedNotice || isHeavyDownload) && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-emerald-500/5 to-teal-500/5 dark:from-zinc-900/90 dark:to-zinc-950 space-y-3 animate-in fade-in-50 duration-200">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    High Quality & Cloud Storage Information
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Free cloud web hosting has limited storage and bandwidth for rendering huge 4K/2K video files in the cloud. The web downloader will deliver the highest possible quality available for this video.
                  </p>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                    To download in <strong className="text-emerald-600 dark:text-emerald-400">Original 4K / 2K Ultra HD with zero limits</strong>, download our free Windows PC (.EXE) or Android Phone (.APK) app! The app processes videos directly on your device using your PC's storage. Or if you can support us, buy us a coffee to help us buy bigger cloud storage!
                  </p>
                </div>
              </div>

              {/* Direct App Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <a
                  href="https://github.com/mrfreqline/unidownloader/releases/latest/download/A2Z-Downloader-Setup.exe"
                  download="A2Z-Downloader-Setup.exe"
                  className="py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Download PC (.EXE)</span>
                </a>
                <a
                  href="https://github.com/mrfreqline/unidownloader/releases/latest/download/A2Z-Downloader.apk"
                  download="A2Z-Downloader.apk"
                  className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Download Phone (.APK)</span>
                </a>
                <a
                  href="https://wa.me/9779716280428?text=Hi%20A2Z%20Downloader!%20I%20want%20to%20buy%20you%20a%20coffee%20to%20support%20better%20servers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>☕ Buy Us a Coffee</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Dual Clip & Edit Action Buttons (User Request: 60s MP4 Download OR Render & Edit directly from first page) */}
        {(activeTab === 'video' || activeTab === 'watch') && (
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 font-mono">
                <Scissors className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {enhancement.trimEnabled
                    ? `${Math.round(Math.max(1, enhancement.trimEnd - enhancement.trimStart))}s Custom Clip:`
                    : 'Instant 60s Short-Form Clip:'}
                </span>
              </span>
              <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                1080p HD Studio Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Button 1: Download 60s Clip (MP4) */}
              <button
                type="button"
                onClick={handleDownload60sClip}
                disabled={isDownloading}
                className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-zinc-950 hover:brightness-105 active:scale-[0.99] transition shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>
                  Download{' '}
                  {enhancement.trimEnabled
                    ? `${Math.round(Math.max(1, enhancement.trimEnd - enhancement.trimStart))}s`
                    : '60s'}{' '}
                  Clip (MP4)
                </span>
              </button>

              {/* Button 2: Render Clip & Edit (Opens Studio Editor) */}
              <Link
                href={`/editor?src=${encodeURIComponent(media.originalUrl || media.streamUrl || media.downloadUrl || '')}&audio=${encodeURIComponent(media.audioUrl || '')}&origUrl=${encodeURIComponent(media.originalUrl || '')}&title=${encodeURIComponent(media.title)}&start=${enhancement.trimEnabled ? enhancement.trimStart : 0}&duration=${enhancement.trimEnabled ? Math.round(Math.max(1, enhancement.trimEnd - enhancement.trimStart)) : Math.min(media.durationSeconds || 300, 300)}&ratio=${enhancement.aspectRatio || '16:9'}&quality=${encodeURIComponent(selectedQuality)}`}
                className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-sm flex items-center justify-center gap-2 text-center cursor-pointer touch-manipulation"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>
                  ✂️ Render{' '}
                  {enhancement.trimEnabled
                    ? `${Math.round(Math.max(1, enhancement.trimEnd - enhancement.trimStart))}s`
                    : '60s'}{' '}
                  Clip & Edit
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* Quota hint */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-500 px-1 font-mono">

          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            100% Free • Unlimited Worldwide Access
          </span>

          <span>Zero retention • Ephemeral stream</span>
        </div>
      </div>

      {/* QR Code Send to Phone Modal */}
      <QrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        url={media.originalUrl}
        title={media.title}
      />
    </div>
  )
}
