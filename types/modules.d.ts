declare module 'ruhend-scraper' {
  const content: any
  export default content
  export const ttdl: any
  export const igdl: any
  export const igdl2: any
  export const fbdl: any
  export const fbdl2: any
  export const ytsearch: any
}

declare module 'btch-downloader' {
  const content: any
  export default content
  export const fbdown: any
  export const igdl: any
  export const ttdl: any
  export const twitter: any
  export const youtube: any
}

declare module 'fluent-ffmpeg' {
  const content: any
  export default content
}

declare module 'ffmpeg-static' {
  const path: string
  export default path
}

interface Window {
  electronAPI?: {
    isElectron: boolean
    platform: string
    openExternal: (url: string) => void
    getEngineStatus: () => Promise<{ isAvailable: boolean; ytDlpPath: string; ffmpegPath: string; downloadsDir: string }>
    startNativeDownload: (opts: any) => Promise<{ success: boolean; id?: string; error?: string }>
    cancelNativeDownload: (id: string) => Promise<{ success: boolean }>
    openFolder: (filePath?: string) => Promise<boolean>
    renderClip: (opts: any) => Promise<{ success: boolean; filePath?: string; error?: string }>
    extractSubtitles: (url: string) => Promise<{ success: boolean; cues?: Array<{ startStr: string; endStr: string; text: string }>; error?: string }>
    onDownloadProgress: (cb: (data: { id: string; percent: number; speed?: string; total?: string; eta?: string; status?: string }) => void) => () => void
    onDownloadComplete: (cb: (data: { id: string; success: boolean; filePath?: string; error?: string }) => void) => () => void
    onRenderProgress: (cb: (data: { id: string; percent: number; status?: string }) => void) => () => void
  }
}
