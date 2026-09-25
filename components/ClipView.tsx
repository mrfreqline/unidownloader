'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Scissors,
  Sliders,
  RotateCcw,
  Check,
  Download,
  Film,
  HardDrive,
  Clock,
  ExternalLink,
  Search,
  ClipboardPaste,
  X,
  Play,
  Sparkles,
  Video,
  Music,
  Volume2,
} from 'lucide-react'
import MagicProgressBar from './MagicProgressBar'
import { extractYouTubeVideoId } from '@/lib/downloader/client-utils'

interface ClipViewProps {
  initialUrl?: string
  initialTitle?: string
  initialDuration?: number
  initialFileSize?: string
  clippedBlobUrl?: string | null
  onDownloadClip: (
    format: string,
    enhancement: {
      enabled: boolean
      trimEnabled: boolean
      trimStart: number
      trimEnd: number
      targetFormat: string
      compressionLevel: 'original' | 'balanced' | 'small'
      audioBitrate: '128k' | '192k' | '320k'
      normalizeAudio: boolean
      muteAudio: boolean
      aspectRatio?: 'original' | '16:9' | '9:16' | '1:1'
      targetQuality?: string
    },
    url: string,
    title: string
  ) => void
  isDownloading: boolean
  downloadProgress?: number
  downloadMsg?: string | null
}

function formatMmSs(sec: number): string {
  if (isNaN(sec) || sec < 0) return '00:00'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ClipView({
  initialUrl = '',
  initialTitle = '',
  initialDuration = 0,
  initialFileSize = '',
  onDownloadClip,
  isDownloading,
  downloadProgress = 0,
  downloadMsg = null,
  clippedBlobUrl = null,
}: ClipViewProps) {
  const [clipUrl, setClipUrl] = useState(initialUrl)
  const [videoTitle, setVideoTitle] = useState(initialTitle || 'Media Clip')
  const [totalSeconds, setTotalSeconds] = useState(initialDuration > 0 ? initialDuration : 0)
  const [fileSize, setFileSize] = useState(initialFileSize)
  const [directStreamUrl, setDirectStreamUrl] = useState('')
  const [isFetchingInfo, setIsFetchingInfo] = useState(false)

  // Presets mode: 'video' | 'audio'
  const [clipMode, setClipMode] = useState<'video' | 'audio'>('video')
  const [aspectRatio, setAspectRatio] = useState<'original' | '16:9' | '9:16' | '1:1'>('original')
  const [directAudioUrl, setDirectAudioUrl] = useState<string | null>(null)

  // Sliders state
  const [startSec, setStartSec] = useState(0)
  const [clipLength, setClipLength] = useState(60)

  // Formats and settings
  const [containerFormat, setContainerFormat] = useState<'mp4' | 'webm' | 'mkv' | 'gif' | 'mp3'>('mp4')
  const [compressionProfile, setCompressionProfile] = useState<'fast' | 'balanced' | 'compact'>('fast')
  const [bitrate, setBitrate] = useState<'128k' | '192k' | '320k'>('320k')
  const [normalizeAudio, setNormalizeAudio] = useState(false)
  const [muteAudio, setMuteAudio] = useState(false)

  // Post-Clip preview state (stream after clip generation)
  const [clippedPreviewUrl, setClippedPreviewUrl] = useState<string | null>(null)
  const [clippedPreviewTitle, setClippedPreviewTitle] = useState<string>('')
  const [isGeneratingClip, setIsGeneratingClip] = useState(false)

  useEffect(() => {
    if (clippedBlobUrl) {
      setClippedPreviewUrl(clippedBlobUrl)
    }
  }, [clippedBlobUrl])

  // Sync props from parent
  useEffect(() => {
    if (initialUrl) setClipUrl(initialUrl)
    if (initialTitle) setVideoTitle(initialTitle)
    if (initialDuration && initialDuration > 0) {
      setTotalSeconds(initialDuration)
      setClipLength(Math.min(60, initialDuration))
    }
    if (initialFileSize) {
      setFileSize(initialFileSize)
    }
  }, [initialUrl, initialTitle, initialDuration, initialFileSize])

  const [targetQuality, setTargetQuality] = useState<string>('1080p')
  const [availableQualities, setAvailableQualities] = useState<string[]>(['1080p Full HD', '720p HD', '480p Standard', '360p Fast'])

  // Explicitly inspect URL to fetch video title, exact duration, and stream info
  const handleInspect = async (targetToInspect?: string) => {
    const rawUrl = (targetToInspect || clipUrl || '').trim()
    if (!rawUrl) return

    setIsFetchingInfo(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl }),
      })
      const data = await res.json()
      if (data && !data.error) {
        if (data.title) setVideoTitle(data.title)
        if (data.durationSeconds && data.durationSeconds > 0) {
          setTotalSeconds(data.durationSeconds)
          setClipLength(Math.min(60, data.durationSeconds))
        }
        if (data.fileSize) {
          setFileSize(data.fileSize)
        }
        if (data.qualities && Array.isArray(data.qualities) && data.qualities.length > 0) {
          const videoOnlyQuals = data.qualities.filter((q: string) => !q.toLowerCase().includes('audio'))
          if (videoOnlyQuals.length > 0) {
            setAvailableQualities(videoOnlyQuals)
            setTargetQuality(videoOnlyQuals[0])
          }
        }
        if (data.downloadUrl || data.streamUrl) {
          setDirectStreamUrl(data.downloadUrl || data.streamUrl)
        }
        if (data.audioUrl) {
          setDirectAudioUrl(data.audioUrl)
        }
      }
    } catch (err) {
      console.warn('[ClipView inspect error]:', err)
    } finally {
      setIsFetchingInfo(false)
    }
  }

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        const clean = text.trim()
        setClipUrl(clean)
        handleInspect(clean)
      }
    } catch {}
  }

  // Automatically fetch exact video duration and filesize if not yet available
  useEffect(() => {
    if (clipUrl && (!totalSeconds || totalSeconds === 0)) {
      handleInspect(clipUrl)
    }
  }, [clipUrl, totalSeconds])

  // Exact bounds
  const effectiveMax = totalSeconds > 0 ? totalSeconds : 300 // fallback only if undetectable
  const endSec = Math.min(startSec + clipLength, effectiveMax)
  const actualDuration = Math.max(1, endSec - startSec)

  // Exactly 3 Presets requested: Video, Audio, and Reset
  const handlePreset = (type: 'video' | 'audio' | 'reset') => {
    if (type === 'video') {
      setClipMode('video')
      setContainerFormat('mp4')
      setMuteAudio(false)
    } else if (type === 'audio') {
      setClipMode('audio')
      setContainerFormat('mp3')
      setBitrate('320k')
    } else if (type === 'reset') {
      setStartSec(0)
      setClipLength(Math.min(60, effectiveMax))
      setClipMode('video')
      setContainerFormat('mp4')
      setCompressionProfile('fast')
      setBitrate('320k')
      setNormalizeAudio(false)
      setMuteAudio(false)
      setAspectRatio('original')
      setClippedPreviewUrl(null)
    }
  }

  const handleResetAll = () => {
    handlePreset('reset')
  }

  const progressRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Auto-scroll up into the loading banner whenever downloading starts
  useEffect(() => {
    if (isDownloading) {
      if (progressRef.current) {
        progressRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (typeof window !== 'undefined') {
        window.scrollTo({ top: 120, behavior: 'smooth' })
      }
    }
  }, [isDownloading])

  const handleExecuteDownload = async () => {
    if (!clipUrl) return

    // Immediately trigger smooth scroll up to the magic loading banner
    if (progressRef.current) {
      progressRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 120, behavior: 'smooth' })
    }

    const compressionLevelMap: Record<string, 'original' | 'balanced' | 'small'> = {
      fast: 'original',
      balanced: 'balanced',
      compact: 'small',
    }

    const effectiveFormat = clipMode === 'audio' ? 'mp3' : containerFormat
    const targetTitle = `${videoTitle}_clip_${formatMmSs(startSec)}-${formatMmSs(endSec)}`

    // Set post-clip preview URL so user can stream & inspect clip immediately after
    setClippedPreviewTitle(targetTitle)
    if (directStreamUrl) {
      setClippedPreviewUrl(directStreamUrl)
    }

    onDownloadClip(
      effectiveFormat,
      {
        enabled: true,
        trimEnabled: true,
        trimStart: startSec,
        trimEnd: endSec,
        targetFormat: effectiveFormat,
        compressionLevel: compressionLevelMap[compressionProfile] || 'original',
        audioBitrate: bitrate,
        normalizeAudio,
        muteAudio: clipMode === 'audio' ? false : muteAudio,
        aspectRatio,
        targetQuality: clipMode === 'video' ? targetQuality : undefined,
      },
      directStreamUrl || clipUrl,
      targetTitle
    )

    // Scroll to preview after short timeout
    setTimeout(() => {
      if (previewRef.current) {
        previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 1500)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Eyebrow and Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
          <Scissors className="w-3.5 h-3.5" />
          <span>Media Clip</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-heading">
          Cut <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Exactly</span> What You Need.
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl">
          Set start and end markers, trim, compress, and download custom clips without downloading the entire video or installing video editors.
        </p>
      </div>

      {/* URL Input Bar with Paste and Inspect Action */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 shadow-xs flex items-center gap-2">
        <Scissors className="w-5 h-5 text-zinc-400 ml-2 shrink-0" />
        <input
          type="url"
          value={clipUrl}
          onChange={(e) => setClipUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleInspect()}
          placeholder="Paste video link to clip (YouTube, TikTok, Instagram, Twitter)..."
          className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 min-w-0 px-2 py-1.5 font-mono"
        />

        {clipUrl ? (
          <button
            onClick={() => {
              setClipUrl('')
              setDirectStreamUrl('')
              setTotalSeconds(0)
              setFileSize('')
              setVideoTitle('Media Clip')
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition touch-manipulation cursor-pointer shrink-0"
            title="Clear input"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handlePasteClipboard}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition touch-manipulation cursor-pointer shrink-0"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Paste</span>
          </button>
        )}

        <button
          onClick={() => handleInspect()}
          disabled={isFetchingInfo || !clipUrl}
          className="px-3.5 sm:px-5 py-2 sm:py-2 rounded-xl font-semibold text-xs sm:text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 touch-manipulation"
        >
          {isFetchingInfo ? (
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

      {/* Main Enhancement Control Card */}
      <div className="rounded-2xl bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 p-4 sm:p-6 space-y-6 shadow-xs">
        
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white font-heading">
                Media Clip
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500 pt-0.5">
                {fileSize && (
                  <span className="flex items-center gap-1 font-mono text-emerald-500 font-semibold">
                    <HardDrive className="w-3 h-3" />
                    Total size: {fileSize}
                  </span>
                )}
                {totalSeconds > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      Total length: {formatMmSs(totalSeconds)}
                    </span>
                  </>
                )}
                {isFetchingInfo && (
                  <span className="text-[11px] text-amber-500 animate-pulse font-mono">
                    (Inspecting stream size & length...)
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleResetAll}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* Presets: Exactly Video, Audio, and Reset */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
            Clip Presets:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handlePreset('video')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                clipMode === 'video'
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-100 dark:bg-[#171b21] hover:bg-zinc-200 dark:hover:bg-[#1e232b] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>

            <button
              type="button"
              onClick={() => handlePreset('audio')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                clipMode === 'audio'
                  ? 'bg-cyan-500 text-zinc-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-zinc-100 dark:bg-[#171b21] hover:bg-zinc-200 dark:hover:bg-[#1e232b] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Audio</span>
            </button>

            <button
              type="button"
              onClick={() => handlePreset('reset')}
              className="py-2.5 px-3 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-[#171b21] hover:bg-zinc-200 dark:hover:bg-[#1e232b] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Aspect Ratio Selector (Video Mode Only) */}
        {clipMode === 'video' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                Aspect Ratio Frame:
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {aspectRatio === 'original' ? 'Original Source' : aspectRatio === '9:16' ? 'TikTok / Reels (9:16)' : aspectRatio === '16:9' ? 'YouTube / Cinema (16:9)' : 'Square (1:1)'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'original', label: 'Original', sub: 'Native' },
                { id: '16:9', label: '16:9', sub: 'Landscape' },
                { id: '9:16', label: '9:16', sub: 'Vertical Shorts' },
                { id: '1:1', label: '1:1', sub: 'Square' },
              ].map((ratio) => (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => setAspectRatio(ratio.id as any)}
                  className={`py-2 px-2.5 rounded-xl border text-center transition cursor-pointer ${
                    aspectRatio === ratio.id
                      ? 'bg-zinc-100 dark:bg-[#1e232b] border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold shadow-xs'
                      : 'bg-zinc-50 dark:bg-[#171b21] border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xs font-bold">{ratio.label}</div>
                  <div className="text-[9px] text-zinc-400 truncate">{ratio.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Sliders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-[#171b21] border border-zinc-200/80 dark:border-white/5 space-y-5">
          
          {/* Slider 1: Start Position across exact video duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                1. Start Marker Position:
              </span>
              <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-black text-cyan-600 dark:text-cyan-400">
                {formatMmSs(startSec)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(1, effectiveMax - 1)}
              value={startSec}
              onChange={(e) => {
                const newStart = parseInt(e.target.value, 10)
                setStartSec(newStart)
                if (newStart + clipLength > effectiveMax) {
                  setClipLength(Math.max(1, effectiveMax - newStart))
                }
              }}
              className="w-full h-2 rounded-lg bg-zinc-200 dark:bg-[#1e232b] accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-400">
              <span>00:00</span>
              <span>Mid: {formatMmSs(Math.floor(effectiveMax / 2))}</span>
              <span>Total: {formatMmSs(effectiveMax)}</span>
            </div>
          </div>

          {/* Slider 2: Clip Length */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                2. Clip Duration Length:
              </span>
              <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                {actualDuration} seconds ({formatMmSs(actualDuration)})
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={Math.min(300, Math.max(1, effectiveMax - startSec))}
              value={clipLength}
              onChange={(e) => setClipLength(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-lg bg-zinc-200 dark:bg-[#1e232b] accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-zinc-400">
              <span>1 sec</span>
              <span>60s (Shorts/Reel)</span>
              <span>{formatMmSs(Math.min(300, effectiveMax))} (Max 5m Clip)</span>
            </div>

            {/* Quick 1-Tap Clip Duration Presets */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[10px] text-zinc-400 font-mono">Quick Presets:</span>
              {[
                { dur: 15, label: '15s' },
                { dur: 30, label: '30s' },
                { dur: 60, label: '60s Reel' },
                { dur: 120, label: '2m' },
                { dur: 300, label: '5m Max' },
              ].map(p => (
                <button
                  key={p.dur}
                  type="button"
                  onClick={() => setClipLength(Math.min(p.dur, Math.max(1, effectiveMax - startSec)))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer border ${
                    clipLength === p.dur
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'bg-white dark:bg-black/30 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>


          {/* Time Window Preview Pill */}
          <div className="p-3 rounded-xl bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-emerald-500" />
              <span className="text-zinc-600 dark:text-zinc-400">Selected Extract Window:</span>
              <b className="font-mono text-zinc-900 dark:text-white">
                {formatMmSs(startSec)} → {formatMmSs(endSec)}
              </b>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Exact {actualDuration}s Cut
            </span>
          </div>

        </div>

        {/* Quality Ratio / Resolution Selector */}
        {clipMode === 'video' && availableQualities.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-cyan-400" />
                <span>Target Resolution & Quality:</span>
              </label>
              <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Original YouTube HD Stream
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {availableQualities.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setTargetQuality(q)}
                  className={`p-3 rounded-xl border text-left transition relative cursor-pointer ${
                    targetQuality === q
                      ? 'bg-zinc-100 dark:bg-[#1e232b] border-cyan-500 dark:border-cyan-400 text-zinc-900 dark:text-white shadow-xs'
                      : 'bg-zinc-50 dark:bg-[#171b21] border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <div className="font-bold text-xs sm:text-sm">{q}</div>
                  <div className="text-[10px] text-zinc-400">
                    {q.includes('4K') || q.includes('2160') ? 'Ultra HD 4K' : q.includes('1080') ? 'Full HD 1080p' : q.includes('720') ? 'HD 720p' : 'Standard Quality'}
                  </div>
                  {targetQuality === q && (
                    <Check className="w-3.5 h-3.5 text-cyan-400 absolute top-2.5 right-2.5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Output Container format selector (Grid 4) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
            Output Format:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'mp4', label: 'MP4', sub: 'Universal H.264' },
              { id: 'webm', label: 'WebM', sub: 'VP9 Open Web' },
              { id: 'mkv', label: 'MKV', sub: 'Matroska High' },
              { id: 'gif', label: 'GIF', sub: 'Animated Image' },
            ].map(fmt => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setContainerFormat(fmt.id as any)}
                className={`p-3 rounded-xl border text-left transition relative cursor-pointer ${
                  containerFormat === fmt.id
                    ? 'bg-zinc-100 dark:bg-[#1e232b] border-emerald-500 dark:border-emerald-400 text-zinc-900 dark:text-white'
                    : 'bg-zinc-50 dark:bg-[#171b21] border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm">{fmt.label}</div>
                <div className="text-[10px] text-zinc-400">{fmt.sub}</div>
                {containerFormat === fmt.id && (
                  <Check className="w-3.5 h-3.5 text-emerald-500 absolute top-2.5 right-2.5" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Compression Profile selector (Grid 3) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
            Compression Profile:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'fast', label: 'Fast Stream (Lossless)', sub: 'Fastest direct copy without re-encoding' },
              { id: 'balanced', label: 'Balanced (High Quality)', sub: 'Optimized file size with crisp fidelity' },
              { id: 'compact', label: 'Compact (<25MB)', sub: 'Ideal for Discord & mobile messaging' },
            ].map(prof => (
              <button
                key={prof.id}
                type="button"
                onClick={() => setCompressionProfile(prof.id as any)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  compressionProfile === prof.id
                    ? 'bg-zinc-100 dark:bg-[#1e232b] border-cyan-500 dark:border-cyan-400 text-zinc-900 dark:text-white'
                    : 'bg-zinc-50 dark:bg-[#171b21] border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <div className="font-bold text-xs">{prof.label}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">{prof.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Bitrate & Audio checks */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-zinc-100 dark:border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-mono">Audio Bitrate:</span>
            {(['128k', '192k', '320k'] as const).map(br => (
              <button
                key={br}
                type="button"
                onClick={() => setBitrate(br)}
                className={`px-2.5 py-1 rounded-lg font-mono font-medium transition cursor-pointer ${
                  bitrate === br
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold'
                    : 'bg-zinc-100 dark:bg-[#171b21] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {br}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={normalizeAudio}
                onChange={(e) => setNormalizeAudio(e.target.checked)}
                className="w-4 h-4 rounded-xs accent-emerald-500 cursor-pointer"
              />
              <span>Normalize Volume</span>
            </label>

            <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={muteAudio}
                onChange={(e) => setMuteAudio(e.target.checked)}
                className="w-4 h-4 rounded-xs accent-emerald-500 cursor-pointer"
              />
              <span>Mute Audio</span>
            </label>
          </div>
        </div>

        {/* Doing the magic, please wait... banner during download */}
        {isDownloading && (
          <div ref={progressRef} className="pt-2 animate-in fade-in duration-200 scroll-mt-24">
            <MagicProgressBar
              isActive={isDownloading}
              mode="downloading"
            />
          </div>
        )}

        {/* Dual Primary Action Buttons: Download Clip OR Render & Edit Clip in Studio */}
        <div className="pt-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Button 1: Download Exact Clip (MP4 / MP3) */}
            <button
              onClick={handleExecuteDownload}
              disabled={!clipUrl || isDownloading}
              className="py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-zinc-950 hover:brightness-105 active:scale-[0.99] transition shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Doing the magic, please wait...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download {actualDuration}s Clip ({containerFormat.toUpperCase()})</span>
                </>
              )}
            </button>

            {/* Button 2: Render & Open Directly in Studio Editor */}
            <Link
              href={
                clipUrl
                  ? `/editor?src=${encodeURIComponent(directStreamUrl || clipUrl)}&audio=${encodeURIComponent(directAudioUrl || '')}&origUrl=${encodeURIComponent(clipUrl)}&title=${encodeURIComponent(videoTitle || 'media_clip')}&start=${startSec}&duration=${actualDuration}&ratio=${aspectRatio}&quality=${encodeURIComponent(targetQuality)}`
                  : '#'
              }
              onClick={(e) => {
                if (!clipUrl) e.preventDefault()
              }}
              className={`py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-md flex items-center justify-center gap-2 text-center ${
                !clipUrl ? 'opacity-40 pointer-events-none cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>✂️ Render {actualDuration}s Clip & Edit</span>
            </Link>
          </div>

          {downloadMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 text-center font-medium">
              {downloadMsg}
            </div>
          )}
        </div>

        {/* POST-CLIP LIVE PLAYER PREVIEW (Stream Video After Clip) */}
        {clippedPreviewUrl && (
          <div ref={previewRef} className="mt-6 pt-6 border-t border-zinc-200 dark:border-white/10 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Post-Clip Player Preview
                </h4>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Ready for playback & editing
              </span>
            </div>

            {/* Video or Audio Player */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-zinc-200 dark:border-white/10 shadow-lg flex items-center justify-center">
              {clipMode === 'audio' ? (
                <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-bounce">
                    <Music className="w-8 h-8" />
                  </div>
                  <audio
                    src={clippedPreviewUrl}
                    controls
                    className="w-full max-w-md mt-2"
                  />
                  <span className="text-xs text-zinc-400 font-mono">
                    Audio Clip ({containerFormat.toUpperCase()})
                  </span>
                </div>
              ) : !clippedPreviewUrl.startsWith('blob:') && extractYouTubeVideoId(clipUrl || '') ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${extractYouTubeVideoId(clipUrl || '')}?start=${startSec}&end=${Math.min(effectiveMax, startSec + actualDuration)}&autoplay=1&rel=0`}
                  title={clippedPreviewTitle || videoTitle || 'Clip Preview'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  src={
                    clippedPreviewUrl.startsWith('blob:')
                      ? clippedPreviewUrl
                      : `/api/stream-proxy?url=${encodeURIComponent(clippedPreviewUrl)}`
                  }
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                >
                  Your browser does not support HTML5 video preview.
                </video>
              )}
            </div>

            {/* Post-Clip Action Row: Download Clip or Open Studio Editor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleExecuteDownload}
                className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download {clipMode === 'audio' ? 'Audio Clip' : 'Video Clip'}</span>
              </button>

              <Link
                href={`/editor?src=${encodeURIComponent(clippedPreviewUrl.startsWith('blob:') ? clippedPreviewUrl : (clipUrl || directStreamUrl || ''))}&audio=${encodeURIComponent(directAudioUrl || '')}&origUrl=${encodeURIComponent(clipUrl || '')}&title=${encodeURIComponent(clippedPreviewTitle || videoTitle)}&start=${startSec}&duration=${actualDuration}&ratio=${aspectRatio}&quality=${encodeURIComponent(targetQuality)}`}
                className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-zinc-950 hover:brightness-105 active:scale-[0.99] transition shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <Sparkles className="w-4 h-4" />
                <span>✂️ Edit Clip in Studio Editor</span>
              </Link>
            </div>
          </div>
        )}

      </div>

    </div>
  )
}
