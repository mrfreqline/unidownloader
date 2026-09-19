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
} from 'lucide-react'
import MediaEnhancer, { EnhancementSettings } from './MediaEnhancer'

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
}

interface MediaCardProps {
  media: AnalyzedMedia
  tokens: number
  guestDownloadsLeft: number
  isLoggedIn: boolean
  onDownload: (format: string, type: 'video' | 'audio' | 'image', enhancement: EnhancementSettings) => void
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
  const defaultTab = media.fileType || 'video'
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'image'>(defaultTab)

  const availableQualities = media.qualities && media.qualities.length > 0
    ? media.qualities.filter(q => q !== 'Audio Only')
    : ['1080p', '720p', '360p']

  const [selectedQuality, setSelectedQuality] = useState<string>(
    availableQualities.includes('1080p') ? '1080p' : availableQualities[0] || '720p'
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
    if (selectedQuality === '4K') return 10
    if (selectedQuality === '1080p') return 5
    return 2
  }

  const tokenCost = getTokenCost()
  const isFreeTrialApplicable = !isLoggedIn && tokenCost > 0 && guestDownloadsLeft > 0 && selectedQuality !== '4K'
  const canAfford = isFreeTrialApplicable || tokenCost === 0 || tokens >= tokenCost

  const handleDownloadClick = () => {
    if (selectedQuality === '4K' && !isLoggedIn) {
      onRequireAuth('4k')
      return
    }

    if (!canAfford) {
      if (!isLoggedIn && guestDownloadsLeft <= 0) {
        onRequireAuth('limit')
      } else {
        onRequireTokens()
      }
      return
    }

    onDownload(
      activeTab === 'video' ? selectedQuality : activeTab === 'audio' ? 'mp3' : 'original',
      activeTab,
      enhancement
    )
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 sm:p-5 shadow-lg space-y-4 sm:space-y-5 animate-in fade-in-50 duration-200">
      
      {/* Top Media Header: Responsive Aspect-Ratio Thumbnail + Details */}
      <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-start">
        {/* Media Thumbnail: 16:9 on mobile for natural video card presentation */}
        <div className="relative w-full sm:w-48 aspect-video sm:aspect-auto sm:h-28 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0 border border-zinc-200 dark:border-zinc-800">
          <img
            src={media.thumbnail || '/placeholder.png'}
            alt={media.title}
            className="w-full h-full object-cover"
          />
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

          <div className="pt-1.5 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
              Verified Media Stream
            </span>
          </div>
        </div>
      </div>

      {/* Tabs: Mobile-optimized labels so text doesn't squeeze */}
      <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 text-[11px] sm:text-xs font-medium">
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
          <span className="hidden sm:inline">Video Stream</span>
        </button>

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

        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-2 px-1 rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition touch-manipulation cursor-pointer ${
            activeTab === 'image'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">Cover</span>
          <span className="hidden sm:inline">Cover / Image</span>
          <span className="text-[9px] sm:text-[10px] font-mono px-1 rounded-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
            FREE
          </span>
        </button>
      </div>

      {/* Video Quality Selection Grid: 2 columns on mobile, 4 on desktop */}
      {activeTab === 'video' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              Select Video Resolution
            </span>
            <span className="text-zinc-400 text-[10px] sm:text-[11px] font-mono">
              MP4 Container
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {availableQualities.map(q => {
              const isSelected = selectedQuality === q
              const is4K = q === '4K'
              const cost = is4K ? 10 : q === '1080p' ? 5 : 2

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
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {q}
                    </span>
                    {isSelected && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-900 dark:text-zinc-100" />}
                  </div>

                  <div className="mt-1 flex items-center gap-1">
                    {is4K ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-mono font-medium text-amber-600 dark:text-amber-400">
                        <Lock className="w-2.5 h-2.5" /> 10T (Login)
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500">
                        {guestDownloadsLeft > 0 ? 'Free / ' : ''}{cost} Tokens
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
              Studio fidelity stereo stream • Unlimited downloads
            </span>
          </div>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md text-[11px] sm:text-xs shrink-0">
            0 Tokens
          </span>
        </div>
      )}

      {activeTab === 'image' && (
        <div className="p-3 sm:p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 text-xs flex items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
              High Resolution Cover Image
            </span>
            <span className="text-zinc-500 text-[10px] sm:text-[11px]">
              Maximum quality source thumbnail • Unlimited downloads
            </span>
          </div>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md text-[11px] sm:text-xs shrink-0">
            0 Tokens
          </span>
        </div>
      )}

      {/* Optional Media Enhancement Studio */}
      <MediaEnhancer
        mediaType={activeTab}
        durationSeconds={media.durationSeconds || 180}
        settings={enhancement}
        onChange={setEnhancement}
      />

      {/* Action Download Trigger: High-visibility, full-width touch button */}
      <div className="pt-1 space-y-2">
        <button
          onClick={handleDownloadClick}
          disabled={isDownloading}
          className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer touch-manipulation min-h-[48px]"
        >
          {isDownloading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Processing stream...</span>
            </>
          ) : selectedQuality === '4K' && !isLoggedIn ? (
            <>
              <Lock className="w-4 h-4" />
              <span>Log in for 4K Ultra HD (-10 Tokens)</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>
                Download{' '}
                {activeTab === 'video'
                  ? `${selectedQuality} Video`
                  : activeTab === 'audio'
                  ? 'Audio MP3'
                  : 'Cover Image'}
                {isFreeTrialApplicable
                  ? ' (Free Trial)'
                  : tokenCost === 0
                  ? ' (FREE)'
                  : ` (-${tokenCost} Tokens)`}
              </span>
            </>
          )}
        </button>

        {/* Quota hint */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-500 px-1 font-mono">
          <span>
            {activeTab === 'video' && isFreeTrialApplicable && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Using 1 of {guestDownloadsLeft} free trials
              </span>
            )}
            {activeTab === 'video' && !isFreeTrialApplicable && (
              <span>Balance: {tokens} Tokens (Cost: {tokenCost})</span>
            )}
            {(activeTab === 'audio' || activeTab === 'image') && (
              <span className="text-emerald-600 dark:text-emerald-400">
                100% Free • Unlimited
              </span>
            )}
          </span>

          <span>Auto-purge on close</span>
        </div>
      </div>

    </div>
  )
}
