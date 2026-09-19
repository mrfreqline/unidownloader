'use client'

import { useState } from 'react'
import {
  Scissors,
  Sliders,
  FileCode,
  Volume2,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
} from 'lucide-react'

export interface EnhancementSettings {
  enabled: boolean
  trimEnabled: boolean
  trimStart: number
  trimEnd: number
  compressionLevel: 'original' | 'balanced' | 'small'
  targetFormat: string
  audioBitrate: '128k' | '192k' | '320k'
  normalizeAudio: boolean
  muteAudio: boolean
}

interface MediaEnhancerProps {
  mediaType: 'video' | 'audio' | 'image'
  durationSeconds: number
  settings: EnhancementSettings
  onChange: (settings: EnhancementSettings) => void
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function MediaEnhancer({
  mediaType,
  durationSeconds = 180,
  settings,
  onChange,
}: MediaEnhancerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const maxDuration = durationSeconds > 0 ? durationSeconds : 300

  const updateSetting = <K extends keyof EnhancementSettings>(
    key: K,
    value: EnhancementSettings[K]
  ) => {
    onChange({
      ...settings,
      [key]: value,
      enabled: true,
    })
  }

  const handleReset = () => {
    onChange({
      enabled: false,
      trimEnabled: false,
      trimStart: 0,
      trimEnd: maxDuration,
      compressionLevel: 'original',
      targetFormat: mediaType === 'audio' ? 'mp3' : 'mp4',
      audioBitrate: '320k',
      normalizeAudio: false,
      muteAudio: false,
    })
  }

  const videoFormats = [
    { id: 'mp4', label: 'MP4', hint: 'Universal H.264' },
    { id: 'webm', label: 'WebM', hint: 'VP9 Open Web' },
    { id: 'mkv', label: 'MKV', hint: 'Matroska Audio' },
    { id: 'gif', label: 'GIF', hint: 'Animated Clip' },
  ]

  const audioFormats = [
    { id: 'mp3', label: 'MP3', hint: 'Universal' },
    { id: 'wav', label: 'WAV', hint: 'Studio Lossless' },
    { id: 'flac', label: 'FLAC', hint: 'Hi-Fi Audio' },
    { id: 'aac', label: 'AAC', hint: 'Apple / M4A' },
  ]

  if (mediaType === 'image') {
    return null
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 overflow-hidden transition">
      
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 sm:px-4 py-3 flex items-center justify-between hover:bg-zinc-100/60 dark:hover:bg-zinc-850 transition text-left touch-manipulation cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              Media Enhancement
              {settings.enabled && (
                <span className="px-1.5 py-0.2 rounded-sm bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[9px] font-medium">
                  Active
                </span>
              )}
            </span>
            <span className="text-[10px] sm:text-[11px] text-zinc-500 block">
              Trim, compress, and convert before transfer (optional)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-zinc-400 shrink-0">
          <span className="text-[10px] sm:text-[11px] font-mono hidden xs:inline">
            {isExpanded ? 'Hide' : 'Customize'}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Studio Panel */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-4 sm:space-y-5 animate-in fade-in-50 duration-150">
          
          {/* Header Action: Reset */}
          <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <span className="font-mono text-zinc-500 text-[10px] sm:text-[11px]">
              FFMPEG ENGINE
            </span>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer touch-manipulation"
            >
              <RotateCcw className="w-3 h-3" />
              Reset defaults
            </button>
          </div>

          {/* 1. Precision Trimming */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-zinc-500" />
                Trim Clip Range
              </label>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono">
                <span className="px-1.5 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {formatTime(settings.trimStart)}
                </span>
                <span className="text-zinc-400">→</span>
                <span className="px-1.5 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {formatTime(settings.trimEnd)}
                </span>
              </div>
            </div>

            {/* Sliders with touch area */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-[10px] font-mono text-zinc-400 w-8">Start:</span>
                <input
                  type="range"
                  min={0}
                  max={maxDuration}
                  step={1}
                  value={settings.trimStart}
                  onChange={e => {
                    const val = Number(e.target.value)
                    if (val < settings.trimEnd) {
                      updateSetting('trimStart', val)
                      updateSetting('trimEnabled', true)
                    }
                  }}
                  className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100 touch-pan-x"
                />
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-[10px] font-mono text-zinc-400 w-8">End:</span>
                <input
                  type="range"
                  min={0}
                  max={maxDuration}
                  step={1}
                  value={settings.trimEnd}
                  onChange={e => {
                    const val = Number(e.target.value)
                    if (val > settings.trimStart) {
                      updateSetting('trimEnd', val)
                      updateSetting('trimEnabled', true)
                    }
                  }}
                  className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100 touch-pan-x"
                />
              </div>
            </div>
          </div>

          {/* 2. Target Container / Format Conversion */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-zinc-500" />
              Output Container
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(mediaType === 'audio' ? audioFormats : videoFormats).map(fmt => {
                const isSelected = settings.targetFormat.toLowerCase() === fmt.id
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => updateSetting('targetFormat', fmt.id)}
                    className={`p-2 sm:p-2.5 rounded-lg border text-left transition touch-manipulation cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs ring-1 ring-zinc-900 dark:ring-zinc-100'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400 bg-white/50 dark:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">{fmt.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-emerald-500" />}
                    </div>
                    <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">{fmt.hint}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Compression Profile: 1 column on mobile, 3 on desktop */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-zinc-500" />
              Compression Profile
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'original',
                  label: 'Fast Stream (Lossless)',
                  desc: 'Direct copy without re-encoding',
                },
                {
                  id: 'balanced',
                  label: 'Balanced (High Quality)',
                  desc: 'Optimized size with crisp fidelity',
                },
                {
                  id: 'small',
                  label: 'Compact (<25MB)',
                  desc: 'Ideal for Discord and mobile messaging',
                },
              ].map(prof => {
                const isSelected = settings.compressionLevel === prof.id
                return (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => updateSetting('compressionLevel', prof.id as any)}
                    className={`p-2 sm:p-2.5 rounded-lg border text-left transition touch-manipulation cursor-pointer flex sm:block items-center justify-between sm:justify-start ${
                      isSelected
                        ? 'border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs ring-1 ring-zinc-900 dark:ring-zinc-100'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-white/50 dark:bg-zinc-900/50'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold block">{prof.label}</span>
                      <span className="text-[10px] text-zinc-400 block">{prof.desc}</span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-emerald-500 sm:hidden shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 4. Audio Controls & Normalization */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Audio Bitrate */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 font-mono">Bitrate:</span>
              <div className="inline-flex rounded-md bg-zinc-200/80 dark:bg-zinc-800 p-0.5 font-mono text-[11px]">
                {(['128k', '192k', '320k'] as const).map(rate => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => updateSetting('audioBitrate', rate)}
                    className={`px-2 py-0.5 rounded-sm transition touch-manipulation cursor-pointer ${
                      settings.audioBitrate === rate
                        ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    {rate}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Toggles */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer select-none touch-manipulation">
                <input
                  type="checkbox"
                  checked={settings.normalizeAudio}
                  onChange={e => updateSetting('normalizeAudio', e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 accent-zinc-900 dark:accent-zinc-100"
                />
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  Normalize Audio
                </span>
              </label>

              {mediaType === 'video' && (
                <label className="flex items-center gap-1.5 cursor-pointer select-none touch-manipulation">
                  <input
                    type="checkbox"
                    checked={settings.muteAudio}
                    onChange={e => updateSetting('muteAudio', e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700 accent-zinc-900 dark:accent-zinc-100"
                  />
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    Mute Audio
                  </span>
                </label>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
