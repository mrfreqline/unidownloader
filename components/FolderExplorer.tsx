'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Folder,
  FolderOpen,
  FileVideo,
  FileAudio,
  FileText,
  File,
  Play,
  Download,
  ChevronRight,
  ArrowLeft,
  X,
  ExternalLink,
  Tv,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  User,
} from 'lucide-react'
import Hls from 'hls.js'
import { FolderResult, FolderItem } from '@/lib/downloader/terabox-resolver'

interface FolderExplorerProps {
  initialFolder: FolderResult
  onClose?: () => void
}

interface Breadcrumb {
  name: string
  dirId: string
}

export default function FolderExplorer({ initialFolder, onClose }: FolderExplorerProps) {
  const [folderData, setFolderData] = useState<FolderResult>(initialFolder)
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([
    { name: 'Root', dirId: initialFolder.currentDirId || '' },
  ])
  const [loadingDirId, setLoadingDirId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Video Watch Player Modal
  const [activeVideo, setActiveVideo] = useState<FolderItem | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)

  // Handle HLS stream binding when activeVideo changes
  useEffect(() => {
    if (!activeVideo || !videoRef.current) return

    const videoEl = videoRef.current
    const streamSrc = activeVideo.streamUrl || activeVideo.downloadUrl || ''

    if (!streamSrc) return

    // Clean up previous Hls instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (streamSrc.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        })
        hls.loadSource(streamSrc)
        hls.attachMedia(videoEl)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoEl.play().catch(() => {})
        })
        hlsRef.current = hls
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari / iOS HLS support
        videoEl.src = streamSrc
        videoEl.play().catch(() => {})
      }
    } else {
      // Standard MP4 / WebM progressive video
      videoEl.src = streamSrc
      videoEl.play().catch(() => {})
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [activeVideo])

  // Navigate into subfolder
  const handleOpenFolder = async (item: FolderItem) => {
    if (!item.isDir) return
    setLoadingDirId(item.id)
    setError(null)

    try {
      const res = await fetch('/api/folder/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId: folderData.linkId,
          dirId: item.id,
          uid: folderData.uid,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Failed to open directory')
      }

      const data = await res.json()
      setFolderData(prev => ({
        ...prev,
        currentDirId: item.id,
        items: data.items || [],
      }))

      setBreadcrumbs(prev => [...prev, { name: item.name, dirId: item.id }])
    } catch (err: any) {
      setError(err?.message || 'Unable to open folder')
    } finally {
      setLoadingDirId(null)
    }
  }

  // Navigate back via breadcrumb click
  const handleBreadcrumbClick = async (crumbIndex: number) => {
    if (crumbIndex === breadcrumbs.length - 1) return
    const targetCrumb = breadcrumbs[crumbIndex]
    setLoadingDirId(targetCrumb.dirId || 'root')
    setError(null)

    try {
      const res = await fetch('/api/folder/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId: folderData.linkId,
          dirId: targetCrumb.dirId,
          uid: folderData.uid,
        }),
      })

      if (!res.ok) throw new Error('Failed to load folder contents')
      const data = await res.json()

      setFolderData(prev => ({
        ...prev,
        currentDirId: targetCrumb.dirId,
        items: data.items || [],
      }))

      setBreadcrumbs(prev => prev.slice(0, crumbIndex + 1))
    } catch (err: any) {
      setError(err?.message || 'Unable to navigate back')
    } finally {
      setLoadingDirId(null)
    }
  }

const ADSTERRA_SMARTLINK =
  'https://www.profitableratecpmnetwork.com/gvwaq8hih?key=3a220d2a7e229bd864d3aac504d1e304'

  const triggerAdRedirect = () => {
    try {
      window.open(ADSTERRA_SMARTLINK, '_blank', 'noopener,noreferrer')
    } catch {}
  }

  // Download individual file
  const handleDownloadItem = (item: FolderItem) => {
    triggerAdRedirect()
    const downloadUrl = item.downloadUrl || item.streamUrl
    if (!downloadUrl) return

    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = item.name || 'file'
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const videoCount = folderData.items.filter(i => i.isVideo).length
  const folderCount = folderData.items.filter(i => i.isDir).length
  const fileCount = folderData.items.length - folderCount

  return (
    <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 sm:p-5 shadow-lg space-y-4 animate-in fade-in-50 duration-200">
      
      {/* Folder Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-850">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
              {folderData.folderTitle}
            </h2>
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 mt-0.5">
              <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 font-semibold text-zinc-600 dark:text-zinc-400">
                {folderData.platform}
              </span>
              <span>•</span>
              <span>{folderData.items.length} items ({videoCount} videos, {folderCount} folders)</span>
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-end sm:self-auto p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition cursor-pointer"
            title="Close explorer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Breadcrumb Navigation Trail */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs font-mono text-zinc-500 scrollbar-none">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1
          return (
            <div key={crumb.dirId || idx} className="flex items-center gap-1.5 shrink-0">
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
              <button
                onClick={() => handleBreadcrumbClick(idx)}
                disabled={isLast || loadingDirId !== null}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  isLast
                    ? 'font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-900'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                {crumb.name}
              </button>
            </div>
          )
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Directory Item List */}
      <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-0.5">
        {folderData.items.length === 0 ? (
          <div className="text-center py-10 text-zinc-400 text-xs font-mono space-y-2">
            <Folder className="w-8 h-8 mx-auto opacity-40" />
            <p>This folder is currently empty.</p>
          </div>
        ) : (
          folderData.items.map(item => {
            const isLoadingThis = loadingDirId === item.id

            return (
              <div
                key={item.id}
                className="group flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl border border-zinc-100 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-900 transition"
              >
                {/* File / Folder Info */}
                <div
                  onClick={() => item.isDir && handleOpenFolder(item)}
                  className={`flex items-center gap-3 min-w-0 flex-1 ${
                    item.isDir ? 'cursor-pointer' : ''
                  }`}
                >
                  {/* Thumbnail / Icon */}
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 flex items-center justify-center">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : item.isDir ? (
                      <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                    ) : item.isVideo ? (
                      <FileVideo className="w-5 h-5 text-blue-500" />
                    ) : item.name.endsWith('.mp3') ? (
                      <FileAudio className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <File className="w-5 h-5 text-zinc-400" />
                    )}

                    {item.isVideo && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Play className="w-3.5 h-3.5 text-white fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate block">
                        {item.name}
                      </span>
                      {item.isDir && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                          FOLDER
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-zinc-500 mt-0.5">
                      {item.size && (
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-2.5 h-2.5" />
                          {item.size}
                        </span>
                      )}
                      {item.extension && (
                        <span className="uppercase text-zinc-400">
                          {item.extension}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Watch or Download */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.isDir ? (
                    <button
                      onClick={() => handleOpenFolder(item)}
                      disabled={isLoadingThis}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                    >
                      {isLoadingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <span>Open</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      {/* Watch Video Mode */}
                      {item.isVideo && (
                        <button
                          onClick={() => {
                            triggerAdRedirect()
                            setActiveVideo(item)
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition cursor-pointer"
                          title="Watch in browser"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span className="hidden sm:inline">Watch</span>
                        </button>
                      )}

                      {/* Download File */}
                      <button
                        onClick={() => handleDownloadItem(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 transition cursor-pointer shadow-xs"
                        title="Download file directly"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono text-zinc-500 border-t border-zinc-100 dark:border-zinc-850 px-1">
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
          App Bypass Active • High Speed Direct CDN Access
        </span>
        <span>Tap Watch to Stream or Download to Save</span>
      </div>

      {/* Video Player Modal (Watch Mode) */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in-50 duration-200">
          <div className="relative w-full max-w-3xl bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <FileVideo className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-white truncate">
                  {activeVideo.name}
                </span>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Container */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                controls
                playsInline
                className="w-full h-full object-contain"
                poster={activeVideo.thumbnail}
              >
                Your browser does not support HTML5 video streaming.
              </video>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-3 sm:p-4 bg-zinc-900/90 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] font-mono text-zinc-400">
                <span>{activeVideo.size}</span>
                {activeVideo.extension && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                    {activeVideo.extension}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleDownloadItem(activeVideo)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Video File</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
