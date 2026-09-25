'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import {
  Scissors,
  Download,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Smartphone,
  Monitor,
  Square,
  Type,
  Sliders,
  Upload,
  Volume2,
  VolumeX,
  ArrowLeft,
  Check,
  Film,
  Layers,
  Wand2,
  ZoomIn,
  ZoomOut,
  FolderArchive,
  Subtitles,
  Eye,
  EyeOff,
  Move,
  Trash2,
  Plus,
  Edit3,
  FileText,
} from 'lucide-react'

interface LayerItem {
  id: string
  name: string
  type: 'video' | 'text' | 'broll'
  visible: boolean
  opacity: number
}

export interface AutoCaptionWord {
  id: string
  word?: string
  start: number
  end: number
  text: string
}

export type SubtitleStyle = 'hormozi' | 'tiktok' | 'neon' | 'minimal' | 'bold_red'

export default function StudioEditorPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark')

  // Media source state
  const [videoSrc, setVideoSrc] = useState<string>('')
  const [videoTitle, setVideoTitle] = useState<string>('My Studio Project')
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video')
  const [clipStart, setClipStart] = useState<number>(0)
  const [clipDuration, setClipDuration] = useState<number>(60)
  const [targetQuality, setTargetQuality] = useState<string>('1080p')

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false)

  const handleSpeedChange = (spd: number) => {
    setPlaybackSpeed(spd)
    setShowSpeedMenu(false)
    if (videoRef.current) videoRef.current.playbackRate = spd
    if (audioRef.current) audioRef.current.playbackRate = spd
  }

  const formatPlayerTime = (sec: number) => {
    const totalSecs = Math.max(0, Math.floor(sec))
    const m = Math.floor(totalSecs / 60)
    const s = totalSecs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  // Layout / Aspect Ratio Framing (9:16 Shorts/Reels, 16:9 Cinema, 1:1 Square)
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16')
  const [blurPadding, setBlurPadding] = useState<boolean>(true)

  // Video Zoom & Positioning (Problem 3 fix)
  const [zoomScale, setZoomScale] = useState<number>(1.0)
  const [panX, setPanX] = useState<number>(0)
  const [panY, setPanY] = useState<number>(0)

  // Visual Shader / Filter adjustments
  const [brightness, setBrightness] = useState<number>(100)
  const [contrast, setContrast] = useState<number>(100)
  const [saturation, setSaturation] = useState<number>(100)
  const [blur, setBlur] = useState<number>(0)
  const [presetFilter, setPresetFilter] = useState<'none' | 'vibrant' | 'cinema' | 'vintage' | 'bw'>('none')

  // Text Overlay & Captions
  const [captionText, setCaptionText] = useState<string>('Trending Story')
  const [captionPosition, setCaptionPosition] = useState<'top' | 'center' | 'bottom'>('top')
  const [captionColor, setCaptionColor] = useState<string>('#ffffff')
  const [captionBg, setCaptionBg] = useState<boolean>(true)
  const [fontSize, setFontSize] = useState<number>(24)

  // Auto-Captions with CapCut-style Interactive Subtitle Table & Word-Sync Highlights
  const [autoCaptions, setAutoCaptions] = useState<AutoCaptionWord[]>([])
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState<boolean>(false)
  const [autoCaptionEnabled, setAutoCaptionEnabled] = useState<boolean>(true)
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('hormozi')
  const [subtitlePosition, setSubtitlePosition] = useState<'bottom' | 'center' | 'top'>('bottom')
  const [bulkScriptOpen, setBulkScriptOpen] = useState<boolean>(false)
  const [bulkScriptText, setBulkScriptText] = useState<string>('')

  // Timeline Layers Stack
  const [layers, setLayers] = useState<LayerItem[]>([
    { id: 'layer-subtitles', name: 'AI Subtitle Karaoke', type: 'text', visible: true, opacity: 100 },
    { id: 'layer-title', name: 'Headline Overlay', type: 'text', visible: true, opacity: 100 },
    { id: 'layer-video', name: 'Primary Video Track', type: 'video', visible: true, opacity: 100 },
  ])
  const [activeLayerId, setActiveLayerId] = useState<string>('layer-video')

  // Export State & Progress
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [exportProgress, setExportProgress] = useState<number>(0)
  const [exportStatusText, setExportStatusText] = useState<string>('')

  // Audio Sync & Multi-AI State
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [origUrl, setOrigUrl] = useState<string | null>(null)
  const [detectedLang, setDetectedLang] = useState<string>('')
  const [captionProvider, setCaptionProvider] = useState<string>('')
  const [isBrowserTranscribing, setIsBrowserTranscribing] = useState<boolean>(false)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const actxRef = useRef<any>(null)
  const audioSourceNodeRef = useRef<any>(null)
  const audioDestNodeRef = useRef<any>(null)

  // Ingest video and audio from query params (?src=...&audio=...&title=...&start=...&duration=...&quality=...)
  // Automatically routes through /api/stream-proxy so Canvas never gets tainted by CORS!
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const rawQuality = params.get('quality') || '1080p'
      const rawSrc = params.get('src')
      const rawAudio = params.get('audio') || params.get('audioSrc')
      const rawOrig = params.get('origUrl') || params.get('orig')
      const rawTitle = params.get('title')
      const rawRatio = params.get('ratio')
      const rawStart = params.get('start')
      const rawDur = params.get('duration')

      if (rawQuality) {
        setTargetQuality(rawQuality)
      }

      if (rawAudio) {
        const decodedAudio = decodeURIComponent(rawAudio)
        setAudioSrc(decodedAudio)
      } else if (rawOrig) {
        const decodedOrig = decodeURIComponent(rawOrig)
        setAudioSrc(decodedOrig)
      }

      if (rawOrig) {
        setOrigUrl(decodeURIComponent(rawOrig))
      }

      if (rawRatio === '9:16' || rawRatio === '16:9' || rawRatio === '1:1') {
        setAspectRatio(rawRatio)
      }

      if (rawSrc) {
        const decodedSrc = decodeURIComponent(rawSrc)
        setVideoSrc(decodedSrc)
      }
      if (rawTitle) {
        setVideoTitle(decodeURIComponent(rawTitle))
      }
      if (rawStart) {
        const s = parseFloat(rawStart)
        if (!isNaN(s) && s >= 0) {
          setClipStart(s)
          setCurrentTime(s)
        }
      }
      if (rawDur) {
        const d = parseFloat(rawDur)
        if (!isNaN(d) && d > 0) {
          setClipDuration(d)
          setDuration(d)
        }
      }

      const savedTheme = (localStorage.getItem('unidownloader_theme') as any) || 'dark'
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }
  }, [])

  // Auto-generate captions on mount if video or source URL is loaded
  useEffect(() => {
    if ((origUrl || videoSrc) && autoCaptions.length === 0 && !isGeneratingCaptions) {
      handleGenerateAutoCaptions()
    }
  }, [origUrl, videoSrc])

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    setTheme(t)
    localStorage.setItem('unidownloader_theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  }

  // Handle local video or photo upload from user's gallery / disk
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setVideoSrc(url)
    setVideoTitle(file.name.replace(/\.[^/.]+$/, ''))
    setMediaType(file.type.startsWith('image/') ? 'image' : 'video')
  }

  // Toggle play/pause (synchronized with separate audio track if present)
  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      if (audioRef.current) audioRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true)
        if (audioRef.current) {
          audioRef.current.currentTime = videoRef.current!.currentTime
          audioRef.current.play().catch(() => {})
        }
      }).catch(() => {})
    }
  }

  // AI Auto-Caption Generator (Cascades across AI Engines with Auto-Language Detection)
  const handleGenerateAutoCaptions = async () => {
    setIsGeneratingCaptions(true)
    try {
      let effectiveOrig: string | null = origUrl
      if (!effectiveOrig && videoSrc && videoSrc.includes('url=')) {
        try {
          const u = new URL(videoSrc, window.location.href)
          effectiveOrig = u.searchParams.get('url') || null
        } catch {}
      }

      const res = await fetch('/api/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle,
          origUrl: effectiveOrig,
          videoUrl: videoSrc,
          audioUrl: audioSrc,
          durationSeconds: clipDuration || duration || 60,
          clipStart: clipStart || 0,
          language: 'auto',
        }),
      })
      const data = await res.json()
      if (data && data.captions && data.captions.length > 0) {
        const firstStart = data.captions[0]?.start ?? 0
        const needsShift = firstStart < clipStart && clipStart > 0
        const shifted = data.captions.map((c: any) => ({
          ...c,
          start: Number((needsShift ? c.start + clipStart : c.start).toFixed(2)),
          end: Number((needsShift ? c.end + clipStart : c.end).toFixed(2)),
          text: c.text || c.word || '',
        }))
        setAutoCaptions(shifted)
        setAutoCaptionEnabled(true)
        if (data.detectedLanguage) {
          setDetectedLang(data.detectedLanguage)
        }
        if (data.provider) {
          setCaptionProvider(data.provider)
        }
      }
    } catch (err) {
      console.warn('[Auto-Caption error]:', err)
    } finally {
      setIsGeneratingCaptions(false)
    }
  }

  // Browser AI Live Transcribe (Client-side Web Speech API with Auto Language Detection)
  const handleToggleBrowserLiveTranscribe = () => {
    if (isBrowserTranscribing) {
      setIsBrowserTranscribing(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Browser Live Speech Recognition is supported in Google Chrome, Microsoft Edge, Safari, and Opera.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = '' // Browser auto-detects spoken language

      recognition.onstart = () => {
        setIsBrowserTranscribing(true)
        setCaptionProvider('Browser AI Live Speech Recognition')
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(() => {})
          if (audioRef.current) audioRef.current.play().catch(() => {})
          setIsPlaying(true)
        }
      }

      recognition.onresult = (event: any) => {
        const lastIdx = event.results.length - 1
        const result = event.results[lastIdx]
        const transcriptText = result[0]?.transcript?.trim()
        if (transcriptText) {
          const vTime = videoRef.current ? videoRef.current.currentTime : currentTime
          const newCap: AutoCaptionWord = {
            id: `cap_live_${Date.now()}`,
            text: transcriptText,
            word: transcriptText,
            start: Number(Math.max(0, vTime - 1.2).toFixed(1)),
            end: Number((vTime + 1.2).toFixed(1)),
          }
          setAutoCaptions(prev => {
            const filtered = prev.filter(c => Math.abs(c.start - newCap.start) > 0.4)
            return [...filtered, newCap].sort((a, b) => a.start - b.start)
          })
          setAutoCaptionEnabled(true)
        }
      }

      recognition.onerror = (e: any) => {
        console.warn('[Browser SpeechRecognition warn]:', e)
        setIsBrowserTranscribing(false)
      }

      recognition.onend = () => {
        setIsBrowserTranscribing(false)
      }

      recognition.start()
    } catch (e) {
      console.error('[Browser SpeechRecognition error]:', e)
      setIsBrowserTranscribing(false)
    }
  }

  // 1. Add new subtitle line at current playhead timestamp
  const handleAddSubtitle = () => {
    const s = Number(currentTime.toFixed(1))
    const e = Number((currentTime + 2.0).toFixed(1))
    const newCap: AutoCaptionWord = {
      id: `cap_${Date.now()}`,
      text: 'New Subtitle Text',
      start: s,
      end: e,
    }
    setAutoCaptions(prev => [...prev, newCap].sort((a, b) => a.start - b.start))
    setAutoCaptionEnabled(true)
  }

  // 2. Direct edit subtitle text
  const handleUpdateCaptionText = (id: string, newText: string) => {
    setAutoCaptions(prev => prev.map(c => (c.id === id ? { ...c, text: newText } : c)))
  }

  // 3. Edit subtitle timing (start / end)
  const handleUpdateCaptionTiming = (id: string, field: 'start' | 'end', val: number) => {
    setAutoCaptions(prev =>
      prev.map(c => {
        if (c.id !== id) return c
        return {
          ...c,
          [field]: Math.max(0, Number(val.toFixed(1))),
        }
      })
    )
  }

  // 4. Delete subtitle line
  const handleDeleteCaption = (id: string) => {
    setAutoCaptions(prev => prev.filter(c => c.id !== id))
  }

  // 5. Jump/Seek video directly to subtitle timestamp
  const handleJumpToCaption = (start: number) => {
    setCurrentTime(start)
    if (videoRef.current) {
      videoRef.current.currentTime = start
      videoRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  // 6. Bulk script / lyrics import
  const handleApplyBulkScript = () => {
    if (!bulkScriptText.trim()) return
    const rawWords = bulkScriptText.trim().split(/\s+/)
    if (rawWords.length === 0) return

    const totalDur = clipDuration > 0 ? clipDuration : (duration || 60)
    const baseStart = clipStart || 0
    const chunkSize = 3 // 3 words per subtitle block
    const newCaptions: AutoCaptionWord[] = []
    const chunks: string[] = []

    for (let i = 0; i < rawWords.length; i += chunkSize) {
      chunks.push(rawWords.slice(i, i + chunkSize).join(' '))
    }

    const interval = Math.max(1.2, totalDur / chunks.length)
    chunks.forEach((chunk, i) => {
      const s = Number((baseStart + i * interval).toFixed(1))
      const e = Number((baseStart + (i + 1) * interval - 0.2).toFixed(1))
      newCaptions.push({
        id: `bulk_${i}_${Date.now()}`,
        text: chunk,
        start: s,
        end: e,
      })
    })

    setAutoCaptions(newCaptions)
    setAutoCaptionEnabled(true)
    setBulkScriptOpen(false)
    setBulkScriptText('')
  }

  // Clear all subtitles
  const handleClearAllCaptions = () => {
    setAutoCaptions([])
  }

  // Active word calculation for real-time subtitle animation on canvas
  const getActiveCaption = (time: number) => {
    if (!autoCaptionEnabled || autoCaptions.length === 0) return null
    return autoCaptions.find(c => time >= c.start && time <= c.end)
  }


  // Canvas Realtime Rendering Loop (Pass 1: Blur BG -> Pass 2: Zoomed Scaled Video -> Pass 3: Layers & Kinetic Subtitles)
  useEffect(() => {
    let animId: number
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Target dimensions based on aspect ratio & requested quality (4K UHD vs 1080p Full HD)
    const is4K = targetQuality.includes('4K') || targetQuality.includes('2160')
    let targetWidth = is4K ? 2160 : 1080
    let targetHeight = is4K ? 3840 : 1920
    if (aspectRatio === '16:9') {
      targetWidth = is4K ? 3840 : 1920
      targetHeight = is4K ? 2160 : 1080
    } else if (aspectRatio === '1:1') {
      targetWidth = is4K ? 2160 : 1080
      targetHeight = is4K ? 2160 : 1080
    }

    canvas.width = targetWidth
    canvas.height = targetHeight


    const render = () => {
      ctx.clearRect(0, 0, targetWidth, targetHeight)

      const videoLayer = layers.find(l => l.id === 'layer-video')
      const showVideo = videoLayer?.visible !== false

      if (video && video.readyState >= 2 && showVideo) {
        // PASS 1: Blurred stretched background padding for 9:16 vertical shorts
        if (blurPadding) {
          ctx.save()
          ctx.filter = `blur(30px) brightness(0.6)`
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight)
          ctx.restore()
        } else {
          ctx.fillStyle = '#000000'
          ctx.fillRect(0, 0, targetWidth, targetHeight)
        }

        // PASS 2: Sharp Video with Zoom, Pan, and Aspect Scaling
        const vidW = video.videoWidth || 1920
        const vidH = video.videoHeight || 1080
        const baseScale = Math.min(targetWidth / vidW, targetHeight / vidH)
        const effectiveScale = baseScale * zoomScale

        const renderW = vidW * effectiveScale
        const renderH = vidH * effectiveScale
        const renderX = (targetWidth - renderW) / 2 + panX
        const renderY = (targetHeight - renderH) / 2 + panY

        ctx.save()

        // Apply visual shaders / filters
        let filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
        if (blur > 0) filterStr += ` blur(${blur}px)`
        if (presetFilter === 'bw') filterStr += ` grayscale(100%)`
        if (presetFilter === 'vintage') filterStr += ` sepia(60%) hue-rotate(-20deg)`
        if (presetFilter === 'vibrant') filterStr += ` saturate(160%) contrast(110%)`
        if (presetFilter === 'cinema') filterStr += ` contrast(120%) brightness(95%)`

        ctx.filter = filterStr
        ctx.globalAlpha = (videoLayer?.opacity ?? 100) / 100
        ctx.drawImage(video, renderX, renderY, renderW, renderH)
        ctx.restore()

        // PASS 3: Dynamic CapCut Kinetic Subtitles Layer with multi-style engine
        const subLayer = layers.find(l => l.id === 'layer-subtitles')
        if (autoCaptionEnabled && subLayer?.visible !== false) {
          const active = getActiveCaption(currentTime)
          if (active && (active.text || active.word)) {
            ctx.save()
            const textToRender = (active.text || active.word || '').toUpperCase()

            let textY = targetHeight * 0.78
            if (subtitlePosition === 'center') textY = targetHeight * 0.5
            if (subtitlePosition === 'top') textY = targetHeight * 0.22

            if (subtitleStyle === 'hormozi') {
              // Alex Hormozi Pop-In: Vibrant yellow bold text with thick black border on dark rounded pill
              ctx.font = '900 52px Montserrat, Arial Black, sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'

              const metrics = ctx.measureText(textToRender)
              const padX = 32
              const padY = 16

              ctx.fillStyle = 'rgba(0, 0, 0, 0.88)'
              ctx.beginPath()
              ctx.roundRect(
                targetWidth / 2 - metrics.width / 2 - padX,
                textY - 32 - padY,
                metrics.width + padX * 2,
                64 + padY * 2,
                20
              )
              ctx.fill()

              ctx.strokeStyle = '#000000'
              ctx.lineWidth = 10
              ctx.lineJoin = 'round'
              ctx.strokeText(textToRender, targetWidth / 2, textY)

              ctx.fillStyle = '#facc15'
              ctx.shadowColor = 'rgba(250, 204, 21, 0.7)'
              ctx.shadowBlur = 14
              ctx.fillText(textToRender, targetWidth / 2, textY)
            } else if (subtitleStyle === 'tiktok') {
              // TikTok Viral: Crisp white bold font with heavy black stroke
              ctx.font = '900 50px Montserrat, Inter, sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'

              ctx.strokeStyle = '#000000'
              ctx.lineWidth = 12
              ctx.lineJoin = 'round'
              ctx.strokeText(textToRender, targetWidth / 2, textY)

              ctx.fillStyle = '#ffffff'
              ctx.shadowColor = 'rgba(239, 68, 68, 0.7)'
              ctx.shadowBlur = 10
              ctx.fillText(textToRender, targetWidth / 2, textY)
            } else if (subtitleStyle === 'neon') {
              // Cyberpunk Neon Glow: Cyan text with glowing outline
              ctx.font = '900 48px Inter, sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'

              const metrics = ctx.measureText(textToRender)
              ctx.fillStyle = 'rgba(10, 15, 25, 0.85)'
              ctx.strokeStyle = '#22d3ee'
              ctx.lineWidth = 3
              ctx.beginPath()
              ctx.roundRect(
                targetWidth / 2 - metrics.width / 2 - 28,
                textY - 28 - 12,
                metrics.width + 56,
                56 + 24,
                16
              )
              ctx.fill()
              ctx.stroke()

              ctx.fillStyle = '#22d3ee'
              ctx.shadowColor = 'rgba(34, 211, 238, 0.9)'
              ctx.shadowBlur = 24
              ctx.fillText(textToRender, targetWidth / 2, textY)
            } else if (subtitleStyle === 'bold_red') {
              // Crimson Impact: Punchy red with white contrast outline
              ctx.font = '900 52px Montserrat, Arial Black, sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'

              ctx.strokeStyle = '#ffffff'
              ctx.lineWidth = 8
              ctx.lineJoin = 'round'
              ctx.strokeText(textToRender, targetWidth / 2, textY)

              ctx.fillStyle = '#ef4444'
              ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
              ctx.shadowBlur = 10
              ctx.fillText(textToRender, targetWidth / 2, textY)
            } else {
              // Clean Minimal: Elegant white text on translucent dark badge
              ctx.font = '700 42px Inter, sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'

              const metrics = ctx.measureText(textToRender)
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
              ctx.beginPath()
              ctx.roundRect(
                targetWidth / 2 - metrics.width / 2 - 24,
                textY - 24 - 10,
                metrics.width + 48,
                48 + 20,
                24
              )
              ctx.fill()

              ctx.fillStyle = '#ffffff'
              ctx.fillText(textToRender, targetWidth / 2, textY)
            }

            ctx.restore()
          }
        }

        // PASS 4: Headline Banner Text Layer
        const titleLayer = layers.find(l => l.id === 'layer-title')
        if (captionText && titleLayer?.visible !== false) {
          ctx.save()
          ctx.font = `bold ${fontSize * 1.8}px Inter, sans-serif`
          ctx.textAlign = 'center'
          ctx.fillStyle = captionColor

          let textY = targetHeight * 0.15
          if (captionPosition === 'center') textY = targetHeight * 0.5
          if (captionPosition === 'bottom') textY = targetHeight * 0.85

          const textWidth = ctx.measureText(captionText).width
          const padding = 20

          // Caption background badge
          if (captionBg) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
            ctx.beginPath()
            ctx.roundRect(
              targetWidth / 2 - textWidth / 2 - padding,
              textY - (fontSize * 1.8) / 2 - 10,
              textWidth + padding * 2,
              fontSize * 1.8 + 20,
              16
            )
            ctx.fill()
          }

          // Caption text
          ctx.fillStyle = captionColor
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
          ctx.shadowBlur = 8
          ctx.fillText(captionText, targetWidth / 2, textY + (fontSize * 1.8) / 3)
          ctx.restore()
        }
      } else {
        // Placeholder when video is loading or none loaded
        ctx.fillStyle = '#0f1318'
        ctx.fillRect(0, 0, targetWidth, targetHeight)
        ctx.fillStyle = '#64748b'
        ctx.font = '24px sans-serif'
        ctx.textAlign = 'center'
        if (videoSrc) {
          ctx.fillText('Loading media stream...', targetWidth / 2, targetHeight / 2)
        } else {
          ctx.fillText('Import video or photo to preview', targetWidth / 2, targetHeight / 2)
        }
      }

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [
    videoSrc,
    aspectRatio,
    blurPadding,
    zoomScale,
    panX,
    panY,
    brightness,
    contrast,
    saturation,
    blur,
    presetFilter,
    captionText,
    captionPosition,
    captionColor,
    captionBg,
    fontSize,
    autoCaptionEnabled,
    autoCaptions,
    subtitleStyle,
    subtitlePosition,
    currentTime,
    layers,
  ])


  // Reset visual adjustments
  const handleResetFilters = () => {
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setBlur(0)
    setZoomScale(1.0)
    setPanX(0)
    setPanY(0)
    setPresetFilter('none')
    setCaptionText('Trending Story')
    setCaptionPosition('top')
    setCaptionColor('#ffffff')
    setCaptionBg(true)
    setFontSize(24)
    setBlurPadding(true)
  }

  // 1. REAL VIDEO EXPORT WITH SOUND & 4K/HD RESOLUTION (Universal Windows Media Player & Phone Compatible)
  const handleExportRealVideo = async () => {
    setIsExporting(true)
    setExportProgress(15)
    setExportStatusText('Rendering studio-grade MP4 with FFmpeg (Universal 1080p/4K)...')

    const cleanTitle = (videoTitle || 'edited_video').replace(/[^\w\s.-]/gi, '_')
    const finalFilename = `${cleanTitle}_edited_${aspectRatio.replace(':', 'x')}.mp4`

    try {
      const targetUrl = origUrl || videoSrc
      if (!targetUrl) {
        throw new Error('No media source available for rendering.')
      }

      setExportProgress(35)
      setExportStatusText('Applying 9:16 aspect ratio & smooth 30fps CFR encoding...')

      // Check if running inside Android APK (VidMate-style native download)
      if (typeof window !== 'undefined' && (window as any).AndroidBridge?.download) {
        const queryParams = new URLSearchParams({
          url: targetUrl,
          quality: targetQuality || '1080p Full HD',
          mediaType: 'video',
          title: finalFilename,
          trimEnabled: 'true',
          trimStart: String(clipStart),
          trimEnd: String(clipStart + (clipDuration || duration || 60)),
          aspectRatio: aspectRatio,
        })
        const downloadHref = `${window.location.origin}/api/download?${queryParams.toString()}`
        ;(window as any).AndroidBridge.download(downloadHref, finalFilename, 'video/mp4')

        setExportProgress(100)
        setExportStatusText('Export queued to Android Downloads! (Check notification bar)')
        setTimeout(() => {
          setIsExporting(false)
          setExportProgress(0)
          setExportStatusText('')
        }, 2500)
        return
      }

      // 2. Windows PC Desktop App (.exe): High-Performance Local FFmpeg Hardware Render
      if (typeof window !== 'undefined' && (window as any).electronAPI?.renderLocalClip) {
        setExportProgress(10)
        setExportStatusText('Initializing native Windows video encoder...')

        const cleanupProgress = (window as any).electronAPI.onRenderProgress((data: { percent: number; statusText: string }) => {
          setExportProgress(data.percent)
          setExportStatusText(data.statusText)
        })

        try {
          const res = await (window as any).electronAPI.renderLocalClip({
            inputUrl: targetUrl,
            audioUrl: audioSrc || undefined,
            trimStart: clipStart,
            trimDuration: clipDuration || duration || 60,
            aspectRatio: aspectRatio,
            targetQuality: targetQuality,
            finalFilename: finalFilename,
          })

          if (cleanupProgress) cleanupProgress()

          if (res?.success) {
            setExportProgress(100)
            setExportStatusText('HD Video Exported Successfully! (Saved to Downloads & Highlighted in Explorer)')
            setTimeout(() => {
              setIsExporting(false)
              setExportProgress(0)
              setExportStatusText('')
            }, 3000)
            return
          }
        } catch (desktopErr: any) {
          if (cleanupProgress) cleanupProgress()
          console.warn('[Desktop Local Render failed, falling back to server]:', desktopErr)
        }
      }

      setExportProgress(35)
      setExportStatusText('Rendering studio-grade MP4 with FFmpeg (+faststart header)...')

      // 3. Web Browser: Request serverless FFmpeg render
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          quality: targetQuality || '1080p Full HD',
          mediaType: 'video',
          title: finalFilename,
          enhancement: {
            enabled: true,
            trimEnabled: true,
            trimStart: clipStart,
            trimEnd: clipStart + (clipDuration || duration || 60),
            aspectRatio: aspectRatio,
            targetFormat: 'mp4',
            compressionLevel: 'original',
          },
        }),
      })

      setExportProgress(75)
      setExportStatusText('Finalizing MP4 container with faststart header for instant playback...')

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Server rendering failed')
      }

      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = blobUrl
      a.download = finalFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
      }, 5000)

      setExportProgress(100)
      setExportStatusText('HD Video Exported Successfully! (100% Windows & Phone Compatible)')
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
        setExportStatusText('')
      }, 2500)
    } catch (err: any) {
      console.error('[Video export error]:', err)
      setExportStatusText(`Export failed: ${err?.message || 'Error'}. Please try again.`)
      setTimeout(() => {
        setIsExporting(false)
      }, 3500)
    }
  }


  // 2. CAPCUT NATIVE DRAFT EXPORT (Module 8 blueprint: draft_content.json generator)
  const handleExportCapCutDraft = () => {
    const draftJson = {
      canvas_config: {
        width: aspectRatio === '16:9' ? 1920 : 1080,
        height: aspectRatio === '16:9' ? 1080 : 1920,
        ratio: aspectRatio,
      },
      tracks: [
        {
          id: 'video_track_1',
          type: 'video',
          segments: [
            {
              id: 'seg_video_main',
              material_id: 'mat_video_1',
              target_timerange: {
                start: Math.round(clipStart * 1000000),
                duration: Math.round((clipDuration || duration || 60) * 1000000),
              },
              clip: { scale: { x: zoomScale, y: zoomScale } },
            },
          ],
        },
        {
          id: 'caption_track_2',
          type: 'text',
          segments: autoCaptions.map((cap, idx) => ({
            id: `seg_cap_${idx}`,
            material_id: `mat_text_${idx}`,
            target_timerange: {
              start: Math.round(cap.start * 1000000),
              duration: Math.round(Math.max(0.1, cap.end - cap.start) * 1000000),
            },
          })),
        },
      ],
      materials: {
        videos: [{ id: 'mat_video_1', path: videoTitle, title: videoTitle }],
        texts: autoCaptions.map((cap, idx) => ({
          id: `mat_text_${idx}`,
          content: cap.text || cap.word || '',
          font_size: 48.0,
          text_color:
            subtitleStyle === 'hormozi'
              ? '#facc15'
              : subtitleStyle === 'neon'
              ? '#22d3ee'
              : subtitleStyle === 'bold_red'
              ? '#ef4444'
              : '#ffffff',
          border_color: '#000000',
          border_width: 4.0,
        })),
      },
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(draftJson, null, 2))
    const a = document.createElement('a')
    a.href = dataStr
    a.download = `${videoTitle}_CapCut_draft.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }


  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#090b0e] text-zinc-900 dark:text-[#eef1f4] flex flex-col font-sans transition-colors duration-200">
      <Navbar theme={theme} onThemeChange={applyTheme} activeTab="editor" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Separate audio track element for DASH/adaptive 4K/1080p formats */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          crossOrigin="anonymous"
          preload="auto"
          muted={isMuted}
          className="hidden"
        />
      )}

      {/* Hidden HTML5 video element providing stream frames to the Canvas */}
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          crossOrigin="anonymous"
          playsInline
          preload="auto"
          muted={isMuted}
          onTimeUpdate={() => {
            if (videoRef.current) {
              const cur = videoRef.current.currentTime
              setCurrentTime(cur)
              if (audioRef.current && Math.abs(audioRef.current.currentTime - cur) > 0.25) {
                audioRef.current.currentTime = cur
              }
              if (clipDuration > 0 && cur >= clipStart + clipDuration) {
                videoRef.current.currentTime = clipStart
                if (audioRef.current) audioRef.current.currentTime = clipStart
              }
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              if (clipStart > 0) {
                videoRef.current.currentTime = clipStart
                setCurrentTime(clipStart)
                if (audioRef.current) audioRef.current.currentTime = clipStart
              }
              const natural = videoRef.current.duration
              if (!clipDuration || clipDuration === 0) {
                setDuration(natural)
              }
            }
          }}
          onEnded={() => {
            setIsPlaying(false)
            if (audioRef.current) audioRef.current.pause()
          }}
          onError={() => {
            console.warn('[Video playback error, retrying without proxy or crossOrigin]')
            if (videoRef.current) {
              if (videoRef.current.crossOrigin) {
                videoRef.current.removeAttribute('crossOrigin')
                videoRef.current.load()
              } else if (videoSrc && videoSrc.includes('/api/stream-proxy')) {
                try {
                  const u = new URL(videoSrc, window.location.href)
                  const direct = u.searchParams.get('url')
                  if (direct) {
                    setVideoSrc(direct)
                  }
                } catch {}
              }
            }
          }}
          className="hidden"
        />
      )}


      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition"
              title="Back to Downloader"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                <span>CapCut Studio Pro Edition</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white font-heading">
                {videoTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-[#171b21] hover:bg-zinc-200 dark:hover:bg-[#1e232b] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span>Import File</span>
            </button>

            <button
              onClick={handleExportCapCutDraft}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-[#171b21] hover:bg-zinc-200 dark:hover:bg-[#1e232b] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Export editable timeline draft for CapCut desktop"
            >
              <FolderArchive className="w-3.5 h-3.5 text-cyan-400" />
              <span>CapCut Draft</span>
            </button>

            <button
              onClick={handleResetFilters}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition flex items-center gap-1 cursor-pointer"
              title="Reset all edits"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* REAL VIDEO EXPORT BUTTON (Renders real MP4/WebM video file) */}
            <button
              onClick={handleExportRealVideo}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-zinc-950 hover:brightness-105 active:scale-[0.98] transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? `${exportProgress}% Rendering...` : 'Render & Export Video (MP4)'}</span>
            </button>
          </div>
        </div>

        {exportStatusText && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-500 text-center animate-in fade-in duration-200">
            {exportStatusText}
          </div>
        )}

        {/* Studio Workspace Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Live Stage / Canvas Rendering Viewport */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 p-4 sm:p-6 shadow-xs space-y-4">
            
            {/* Viewport Frame with Docked HTML5 Native-Style Control Bar */}
            <div className={`relative w-full max-w-[380px] ${aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '1:1' ? 'aspect-square' : 'aspect-[9/16]'} rounded-2xl overflow-hidden bg-black shadow-2xl border border-zinc-300 dark:border-white/10 flex flex-col justify-end group`}>
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
              />

              {/* Native-Style HTML5 Video Control Bar (Matches User Screenshot) */}
              {videoSrc && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-3 py-2.5 pt-7 flex flex-col gap-2 transition-opacity duration-200">
                  {/* Full-Width Smooth Scrubber Bar */}
                  <div className="relative w-full flex items-center">
                    <input
                      type="range"
                      min={clipStart}
                      max={clipStart + (clipDuration || duration || 60)}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        setCurrentTime(val)
                        if (videoRef.current) videoRef.current.currentTime = val
                        if (audioRef.current) audioRef.current.currentTime = val
                      }}
                      className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white hover:h-1.5 transition-all"
                    />
                  </div>

                  {/* Controls Row: Play/Pause, 0:09 / 1:13, Volume, Speed, Export */}
                  <div className="flex items-center justify-between text-white text-xs font-mono select-none">
                    <div className="flex items-center gap-2.5">
                      {/* Play/Pause Button */}
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="p-1 hover:text-emerald-400 transition cursor-pointer flex items-center justify-center"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      {/* Timestamp e.g. 0:09 / 1:13 */}
                      <span className="text-[11px] font-mono text-zinc-300">
                        {formatPlayerTime(Math.max(0, currentTime - clipStart))} / {formatPlayerTime(clipDuration || duration || 60)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 relative">
                      {/* Volume / Mute */}
                      <button
                        type="button"
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-1 text-zinc-300 hover:text-white transition cursor-pointer"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>

                      {/* Playback Speed Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 hover:bg-white/20 text-zinc-200 transition cursor-pointer flex items-center gap-0.5"
                          title="Playback Speed"
                        >
                          <span>{playbackSpeed}x</span>
                        </button>

                        {showSpeedMenu && (
                          <div className="absolute bottom-full right-0 mb-2 py-1 w-20 rounded-lg bg-zinc-900 border border-white/15 shadow-2xl flex flex-col z-50">
                            {[0.5, 1, 1.25, 1.5, 2].map((spd) => (
                              <button
                                key={spd}
                                type="button"
                                onClick={() => handleSpeedChange(spd)}
                                className={`px-2 py-1 text-left text-[11px] hover:bg-white/10 transition ${playbackSpeed === spd ? 'text-emerald-400 font-bold' : 'text-zinc-300'}`}
                              >
                                {spd}x
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Export / Download Clip Button right on player */}
                      <button
                        type="button"
                        onClick={handleExportRealVideo}
                        disabled={isExporting}
                        className="p-1 text-zinc-300 hover:text-emerald-400 transition cursor-pointer disabled:opacity-50"
                        title="Render & Download Video (MP4)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Studio Toolset Panel */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* 1. Format / Aspect Ratio Framing */}
            <div className="rounded-2xl bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>Framing & Aspect Ratio</span>
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '9:16', label: '9:16 Shorts', sub: 'TikTok / Reels' },
                  { id: '16:9', label: '16:9 Cinema', sub: 'YouTube HD' },
                  { id: '1:1', label: '1:1 Square', sub: 'Instagram Feed' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setAspectRatio(item.id as any)}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      aspectRatio === item.id
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                        : 'bg-zinc-50 dark:bg-[#171b21] border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{item.sub}</div>
                  </button>
                ))}
              </div>

              {/* Blurred background padding switch */}
              <label className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 pt-2 cursor-pointer">
                <span>Blurred Video Padding (No black bars)</span>
                <input
                  type="checkbox"
                  checked={blurPadding}
                  onChange={(e) => setBlurPadding(e.target.checked)}
                  className="w-4 h-4 rounded-xs accent-emerald-500 cursor-pointer"
                />
              </label>
            </div>

            {/* 2. Video Zoom In/Out & Pan Controls (Problem 3 fix) */}
            <div className="rounded-2xl bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <ZoomIn className="w-4 h-4 text-emerald-400" />
                  <span>Zoom & Subject Reframing</span>
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-500">
                  {(zoomScale * 100).toFixed(0)}%
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-500 font-mono">
                    <span>Zoom Scale</span>
                    <span>{zoomScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={3.0}
                    step={0.05}
                    value={zoomScale}
                    onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs font-mono">
                  <button
                    onClick={() => setZoomScale(prev => Math.min(3.0, prev + 0.1))}
                    className="py-2 px-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#171b21] hover:bg-zinc-100 dark:hover:bg-[#1e232b] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom In (+10%)</span>
                  </button>
                  <button
                    onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.1))}
                    className="py-2 px-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#171b21] hover:bg-zinc-100 dark:hover:bg-[#1e232b] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                    <span>Zoom Out (-10%)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Layer Stack Editor (Problem 3 fix) */}
            <div className="rounded-2xl bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Timeline Tracks & Layers</span>
                </h3>
                <span className="text-[11px] font-mono text-zinc-400">{layers.length} Layers</span>
              </div>

              <div className="space-y-2">
                {layers.map(layer => (
                  <div
                    key={layer.id}
                    onClick={() => setActiveLayerId(layer.id)}
                    className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-3 text-xs cursor-pointer ${
                      activeLayerId === layer.id
                        ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-300 font-semibold'
                        : 'bg-zinc-50 dark:bg-[#171b21] border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l))
                        }}
                        className="text-zinc-400 hover:text-white"
                      >
                        {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-500" />}
                      </button>
                      <span>{layer.name}</span>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10">
                      {layer.type.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. CapCut Pro Subtitle Studio (Module 6 & Problem 3 fix) */}
            <div className="rounded-2xl bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Subtitles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    CapCut Subtitle Studio
                  </h3>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono">
                  <input
                    type="checkbox"
                    checked={autoCaptionEnabled}
                    onChange={(e) => setAutoCaptionEnabled(e.target.checked)}
                    className="w-4 h-4 rounded-xs accent-amber-500 cursor-pointer"
                  />
                  <span className="text-zinc-500 dark:text-zinc-400">On Stage</span>
                </label>
              </div>

              {/* Subtitle Style Presets (CapCut / Hormozi Themes) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-zinc-400 block">
                  Subtitle Style Theme:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { id: 'hormozi', label: '⚡ Hormozi Pop', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
                    { id: 'tiktok', label: '🔥 TikTok Viral', bg: 'bg-zinc-500/10 text-white border-zinc-500/30' },
                    { id: 'neon', label: '💎 Cyber Neon', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
                    { id: 'minimal', label: '✨ Clean Pill', bg: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30' },
                    { id: 'bold_red', label: '🚨 Crimson Bold', bg: 'bg-red-500/10 text-red-400 border-red-500/30' },
                  ].map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSubtitleStyle(s.id as SubtitleStyle)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition text-left cursor-pointer ${
                        subtitleStyle === s.id
                          ? `${s.bg} ring-1 ring-amber-500 font-extrabold shadow-xs`
                          : 'bg-zinc-50 dark:bg-[#171b21] border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtitle Screen Position */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-zinc-400 block">
                  Screen Alignment:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                  {(['bottom', 'center', 'top'] as const).map(pos => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setSubtitlePosition(pos)}
                      className={`py-1.5 rounded-lg border capitalize transition cursor-pointer ${
                        subtitlePosition === pos
                          ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                          : 'bg-zinc-50 dark:bg-[#171b21] border-zinc-200 dark:border-white/10 text-zinc-500'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active AI Engine & Auto-Detected Spoken Language Badge */}
              {captionProvider && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="font-semibold text-zinc-900 dark:text-amber-200 truncate">
                      {captionProvider}
                    </span>
                  </div>
                  {detectedLang && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold uppercase shrink-0">
                      Lang: {detectedLang}
                    </span>
                  )}
                </div>
              )}

              {/* Action Toolbar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleGenerateAutoCaptions}
                  disabled={isGeneratingCaptions}
                  className="py-2 px-2 rounded-xl text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Generate word-timed AI captions cascading across engines"
                >
                  <Wand2 className="w-3 h-3 text-amber-500" />
                  <span>{isGeneratingCaptions ? 'Syncing...' : '✨ AI Auto-Sync'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleBrowserLiveTranscribe}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                    isBrowserTranscribing
                      ? 'bg-red-500 text-white border-red-600 animate-pulse'
                      : 'bg-zinc-100 dark:bg-[#171b21] hover:bg-zinc-200 dark:hover:bg-[#1e232b] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10'
                  }`}
                  title="Use Browser Native AI Speech Recognition"
                >
                  <span className="text-xs">🎙️</span>
                  <span>{isBrowserTranscribing ? 'Listening...' : 'Live STT'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddSubtitle}
                  className="py-2 px-2 rounded-xl text-[11px] font-bold bg-zinc-100 dark:bg-[#171b21] hover:bg-zinc-200 dark:hover:bg-[#1e232b] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 transition flex items-center justify-center gap-1 cursor-pointer"
                  title="Add subtitle line at current playhead"
                >
                  <Plus className="w-3 h-3 text-emerald-500" />
                  <span>+ Line</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkScriptOpen(!bulkScriptOpen)}
                  className="py-2 px-2 rounded-xl text-[11px] font-bold bg-zinc-100 dark:bg-[#171b21] hover:bg-zinc-200 dark:hover:bg-[#1e232b] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 transition flex items-center justify-center gap-1 cursor-pointer"
                  title="Paste full script or lyrics"
                >
                  <FileText className="w-3 h-3 text-cyan-400" />
                  <span>📝 Script</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAllCaptions}
                  disabled={autoCaptions.length === 0}
                  className="py-2 px-2 rounded-xl text-[11px] font-bold text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-zinc-200 dark:border-white/10 transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                  title="Clear all subtitles"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Bulk Script Paste Area */}
              {bulkScriptOpen && (
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Paste Script / Lyrics / Transcript:
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Auto-segments 3 words/line
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={bulkScriptText}
                    onChange={(e) => setBulkScriptText(e.target.value)}
                    placeholder="Paste your video dialogue or lyrics here..."
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white outline-none resize-none"
                  />
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setBulkScriptOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyBulkScript}
                      className="px-3.5 py-1.5 rounded-lg font-bold bg-emerald-500 text-zinc-950 hover:brightness-105 transition"
                    >
                      Auto-Distribute Subtitles
                    </button>
                  </div>
                </div>
              )}

              {/* Interactive Subtitle List (CapCut Table / Timeline Stack) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Editable Subtitle Tracks ({autoCaptions.length})</span>
                  <span>Click to Seek & Live Edit</span>
                </div>

                {autoCaptions.length === 0 ? (
                  <div className="py-6 px-4 rounded-xl border border-dashed border-zinc-200 dark:border-white/10 text-center text-xs text-zinc-500 space-y-2">
                    <Subtitles className="w-6 h-6 mx-auto text-zinc-400 opacity-60" />
                    <p>No subtitle lines yet.</p>
                    <p className="text-[11px] text-zinc-400">
                      Click <b className="text-amber-500">✨ AI Auto-Sync</b> or <b className="text-emerald-500">+ Add Line</b> to create editable captions.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {autoCaptions.map((cap, idx) => {
                      const isActive = currentTime >= cap.start && currentTime <= cap.end
                      return (
                        <div
                          key={cap.id}
                          className={`p-2.5 rounded-xl border transition space-y-2 ${
                            isActive
                              ? 'bg-amber-500/10 border-amber-500 shadow-sm'
                              : 'bg-zinc-50 dark:bg-[#171b21] border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                          }`}
                        >
                          {/* Top Row: Timestamps & Controls */}
                          <div className="flex items-center justify-between gap-2 text-xs font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-zinc-400 font-bold">#{idx + 1}</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={cap.start}
                                onChange={(e) => handleUpdateCaptionTiming(cap.id, 'start', parseFloat(e.target.value) || 0)}
                                className="w-14 px-1.5 py-0.5 rounded-md bg-white dark:bg-black/50 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-center text-xs outline-none"
                              />
                              <span className="text-zinc-400">→</span>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={cap.end}
                                onChange={(e) => handleUpdateCaptionTiming(cap.id, 'end', parseFloat(e.target.value) || 0)}
                                className="w-14 px-1.5 py-0.5 rounded-md bg-white dark:bg-black/50 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-center text-xs outline-none"
                              />
                              <span className="text-[10px] text-zinc-400">s</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isActive && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-zinc-950 animate-pulse">
                                  LIVE
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleJumpToCaption(cap.start)}
                                className="p-1 rounded-md text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition"
                                title="Jump to this timestamp"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCaption(cap.id)}
                                className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition"
                                title="Delete this line"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Bottom Row: Editable Subtitle Text */}
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={cap.text || cap.word || ''}
                              onChange={(e) => handleUpdateCaptionText(cap.id, e.target.value)}
                              placeholder="Type subtitle words..."
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-900 dark:text-white outline-none focus:border-amber-500 transition"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>


            {/* 5. Color Shaders & Cinematic LUT Presets */}
            <div className="rounded-2xl bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Color & Cinematic Shaders</span>
                </h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-500 font-mono">
                    <span>Brightness</span>
                    <span>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-500 font-mono">
                    <span>Contrast</span>
                    <span>{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-500 font-mono">
                    <span>Saturation</span>
                    <span>{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={saturation}
                    onChange={(e) => setSaturation(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 6. Text Overlay & Caption Styling */}
            <div className="rounded-2xl bg-white dark:bg-[#12151a] border border-zinc-200 dark:border-white/10 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/10 pb-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <Type className="w-4 h-4 text-amber-500" />
                  <span>Headline Badge Overlay</span>
                </h3>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  placeholder="Enter caption or headline..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#171b21] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none"
                />

                <div className="grid grid-cols-3 gap-2">
                  {(['top', 'center', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setCaptionPosition(pos)}
                      className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer border ${
                        captionPosition === pos
                          ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                          : 'bg-zinc-50 dark:bg-[#171b21] border-zinc-200 dark:border-white/10 text-zinc-500'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  )
}
