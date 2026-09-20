export interface StreamResult {
  title: string
  thumbnail?: string
  duration?: string
  uploader?: string
  platform: string
  qualities: string[]
  streamUrl?: string
  downloadUrl: string
  audioUrl?: string
  isDirectMovie?: boolean
  fileSize?: string
  isMaintenance?: boolean
  maintenanceMessage?: string
}

// Check if a URL points directly to a movie or video file
export function isDirectVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname.toLowerCase()
    return (
      pathname.endsWith('.mp4') ||
      pathname.endsWith('.mkv') ||
      pathname.endsWith('.webm') ||
      pathname.endsWith('.avi') ||
      pathname.endsWith('.mov') ||
      pathname.endsWith('.m4v') ||
      pathname.endsWith('.m3u8')
    )
  } catch {
    return false
  }
}

// Check if a URL is from YouTube
export function isYouTubeUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return (
      host.includes('youtube.com') ||
      host.includes('youtu.be') ||
      host.includes('youtube-nocookie.com')
    )
  } catch {
    return false
  }
}

// Inspect a direct movie / video URL via HTTP HEAD
export async function inspectDirectVideo(url: string): Promise<StreamResult | null> {
  try {
    const headRes = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    const contentType = headRes.headers.get('content-type') || ''
    const contentLength = headRes.headers.get('content-length')
    const isVideo =
      contentType.includes('video') ||
      contentType.includes('octet-stream') ||
      isDirectVideoUrl(url)

    if (!isVideo && !headRes.ok) {
      return null
    }

    let sizeStr = ''
    if (contentLength) {
      const bytes = parseInt(contentLength, 10)
      if (!isNaN(bytes)) {
        if (bytes >= 1024 * 1024 * 1024) {
          sizeStr = `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
        } else if (bytes >= 1024 * 1024) {
          sizeStr = `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        }
      }
    }

    // Extract filename from URL
    const pathname = new URL(url).pathname
    const rawFileName = pathname.split('/').pop() || 'Movie Stream'
    const cleanTitle = decodeURIComponent(rawFileName).replace(/[._-]/g, ' ').replace(/\.[a-z0-9]+$/i, '')

    return {
      title: cleanTitle || 'Direct Video / Movie Stream',
      platform: 'Direct Movie Stream',
      qualities: ['Original Quality', 'HD Stream', 'Audio Only'],
      streamUrl: url,
      downloadUrl: url,
      isDirectMovie: true,
      fileSize: sizeStr || 'High Bitrate Stream',
      thumbnail: '',
      uploader: 'Direct Web Host',
      duration: 'Full Length',
    }
  } catch (err) {
    console.warn('[Direct Movie Inspect Error]:', err)
    return null
  }
}

// TikTok Dedicated Resolver (TikWM API - 100% Free, High Speed, No Watermark)
export async function resolveTikTok(url: string): Promise<StreamResult | null> {
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    })
    const data = await res.json()
    if (data.code === 0 && data.data) {
      const item = data.data
      const downloadUrl = item.play || item.hdplay || item.wmplay
      return {
        title: item.title || 'TikTok Video (No Watermark)',
        thumbnail: item.cover,
        duration: item.duration ? `${item.duration}s` : undefined,
        uploader: item.author?.nickname || item.author?.unique_id || 'TikTok Creator',
        platform: 'TikTok',
        qualities: item.hdplay ? ['1080p HD (No Watermark)', 'Standard (No Watermark)', 'Audio MP3'] : ['Standard (No Watermark)', 'Audio MP3'],
        streamUrl: downloadUrl,
        downloadUrl: downloadUrl,
        audioUrl: item.music || item.music_info?.play,
      }
    }
  } catch (err) {
    console.warn('[TikTok Resolver Error]:', err)
  }
  return null
}

// Multi-instance Cobalt API Stream Resolver (TikTok, Instagram, Facebook, Twitter/X, Twitch, Reddit, Vimeo)
const COBALT_INSTANCES = [
  'https://api.cobalt.tools',
  'https://cobalt.api.scav.top',
  'https://capi.wuk.sh',
  'https://cobalt-api.kwiatekm.tokyo',
]

export async function resolveViaCobalt(url: string): Promise<StreamResult | null> {
  for (const instance of COBALT_INSTANCES) {
    try {
      const res = await fetch(`${instance}/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'UniDownloader/2.0',
        },
        body: JSON.stringify({
          url,
          videoQuality: '1080',
          downloadMode: 'auto',
          youtubeVideoCodec: 'h264',
        }),
      })

      if (!res.ok) continue

      const data = await res.json()
      if (data.status === 'stream' || data.status === 'redirect' || data.status === 'tunnel') {
        const streamUrl = data.url
        const host = new URL(url).hostname.replace('www.', '').split('.')[0]
        const capitalizedPlatform = host.charAt(0).toUpperCase() + host.slice(1)

        return {
          title: data.filename || `${capitalizedPlatform} Media Stream`,
          platform: capitalizedPlatform,
          qualities: ['1080p Full HD', '720p HD', 'Audio MP3'],
          streamUrl: streamUrl,
          downloadUrl: streamUrl,
          uploader: `${capitalizedPlatform} User`,
          duration: 'Direct Stream',
        }
      }

      if (data.status === 'picker' && Array.isArray(data.picker) && data.picker.length > 0) {
        const firstItem = data.picker[0]
        return {
          title: 'Media Carousel / Gallery',
          platform: 'Social Media',
          qualities: ['High Quality', 'Standard'],
          streamUrl: firstItem.url,
          downloadUrl: firstItem.url,
          thumbnail: firstItem.thumb,
          uploader: 'Creator',
        }
      }
    } catch {
      // Try next instance
      continue
    }
  }
  return null
}

// Universal Resolver orchestrator
export async function resolveMediaUrl(url: string): Promise<StreamResult> {
  const trimmedUrl = url.trim()

  // 1. YouTube Maintenance Guard
  if (isYouTubeUrl(trimmedUrl)) {
    return {
      title: 'YouTube Engine Under Maintenance',
      platform: 'YouTube',
      qualities: [],
      downloadUrl: '',
      isMaintenance: true,
      maintenanceMessage:
        'YouTube Engine is currently undergoing scheduled maintenance for v2.5 upgrade. TikTok, Instagram, Facebook, Twitter/X, Twitch, Reddit, and Direct Movie links are 100% operational!',
    }
  }

  // 2. Direct Movie / Video file inspection
  if (isDirectVideoUrl(trimmedUrl)) {
    const directResult = await inspectDirectVideo(trimmedUrl)
    if (directResult) return directResult
  }

  // 3. TikTok Dedicated High-Speed Resolver
  if (trimmedUrl.includes('tiktok.com')) {
    const tiktokResult = await resolveTikTok(trimmedUrl)
    if (tiktokResult) return tiktokResult
  }

  // 4. Cobalt Stream API (Instagram, Facebook, Twitter, Reddit, Twitch, Vimeo, TikTok fallback)
  const cobaltResult = await resolveViaCobalt(trimmedUrl)
  if (cobaltResult) return cobaltResult

  // 5. Fallback inspection for any video URL
  const genericInspect = await inspectDirectVideo(trimmedUrl)
  if (genericInspect) return genericInspect

  throw new Error('Unable to resolve media from this link. Please ensure the link is public and accessible.')
}
