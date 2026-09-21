'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import MediaEnhancer, { EnhancementSettings } from './MediaEnhancer'
import QrModal from './QrModal'

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

  const tokenCost = getTokenCost()
  const isFreeTrialApplicable = true
  const canAfford = true

  const handleDownloadClick = () => {
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
    } else if (activeTab === 'image' || media.fileType === 'image') {
      targetUrl = media.downloadUrl || media.thumbnail
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

  const hasPlayableStream = Boolean(media.streamUrl || media.downloadUrl)

  return (
    <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 sm:p-5 shadow-lg space-y-4 sm:space-y-5 animate-in fade-in-50 duration-200">
      {/* Top Media Header: Thumbnail + Details */}
      <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-start">
        {/* Media Thumbnail */}
        <div className="relative w-full sm:w-48 aspect-video sm:aspect-auto sm:h-28 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
          {media.thumbnail ? (
            <img
              src={media.thumbnail}
              alt={media.title}
              className="w-full h-full object-cover"
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
                  setEnhancement(prev => ({
                    ...prev,
                    enabled: true,
                    trimEnabled: true,
                    trimStart: 0,
                    trimEnd: Math.min(media.durationSeconds || 60, 60),
                  }))
                }}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 transition cursor-pointer border ${
                  enhancement.trimEnabled
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
                }`}
                title="Trim a short clip or audio ringtone (up to 60 seconds)"
              >
                <Scissors className="w-3 h-3" />
                <span>{enhancement.trimEnabled ? '✂️ Trimming Active (Max 60s)' : '✂️ Trim Clip / Ringtone (60s)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Video, Watch/Stream, Audio, Cover */}
      <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 text-[11px] sm:text-xs font-medium">
        {/* Watch Movie Tab */}
        {hasPlayableStream && (
          <button
            type="button"
            onClick={() => {
              try {
                window.open('https://www.profitableratecpmnetwork.com/gvwaq8hih?key=3a220d2a7e229bd864d3aac504d1e304', '_blank', 'noopener,noreferrer')
              } catch {}
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
      </div>

      {/* Embedded HTML5 Video Player (Watch Mode for Movies or Clips) */}
      {activeTab === 'watch' && hasPlayableStream && (
        <div className="space-y-3 animate-in fade-in-50 duration-200">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-zinc-200 dark:border-zinc-800 shadow-inner">
            <video
              src={media.streamUrl || media.downloadUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
              poster={media.thumbnail}
            >
              Your browser does not support HTML5 video playback.
            </video>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500 font-mono px-1">
            <span>Direct In-Browser Playback</span>
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
                    src={img.thumbnail || img.url}
                    alt={img.title || `Photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
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
