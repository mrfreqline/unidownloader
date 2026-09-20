import dns from 'dns'
import { isTeraBoxOrShareBoxUrl, resolveTeraBoxOrShareBox, FolderResult } from './terabox-resolver'
try {
  dns.setDefaultResultOrder('ipv4first')
} catch {}

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
  folderData?: FolderResult
  fileType?: 'video' | 'audio' | 'image'
  isImage?: boolean
}

// Clean escaped HTML / unicode characters in scraped URLs
function cleanEscapedUrl(str: string): string {
  if (!str) return ''
  return str
    .replace(/\\u0025/g, '%')
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
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

// Check if a URL points directly to an image file
export function isDirectImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname.toLowerCase()
    return (
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.webp') ||
      pathname.endsWith('.gif') ||
      pathname.endsWith('.avif') ||
      pathname.endsWith('.bmp') ||
      pathname.endsWith('.svg') ||
      parsed.hostname.includes('pbs.twimg.com') ||
      parsed.hostname.includes('i.redd.it') ||
      parsed.hostname.includes('i.imgur.com')
    )
  } catch {
    return false
  }
}

// Inspect a direct image URL via HTTP HEAD
export async function inspectDirectImage(url: string): Promise<StreamResult | null> {
  try {
    const headRes = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    const contentType = (headRes.headers.get('content-type') || '').toLowerCase()
    const contentLength = headRes.headers.get('content-length')

    const isImage = contentType.startsWith('image/') || isDirectImageUrl(url)
    if (!isImage || !headRes.ok) {
      return null
    }

    let sizeStr = ''
    if (contentLength) {
      const bytes = parseInt(contentLength, 10)
      if (!isNaN(bytes)) {
        sizeStr = (bytes / (1024 * 1024)).toFixed(2) + ' MB'
      }
    }

    const pathname = new URL(url).pathname
    const rawName = pathname.split('/').pop() || 'image.jpg'
    const cleanName = decodeURIComponent(rawName).slice(0, 40)

    return {
      title: cleanName || 'High Resolution Image',
      platform: 'Direct Image',
      thumbnail: url,
      uploader: 'Image Source',
      qualities: ['Original HD Image', 'JPEG / PNG'],
      streamUrl: url,
      downloadUrl: url,
      fileSize: sizeStr,
      fileType: 'image',
    }
  } catch {
    if (isDirectImageUrl(url)) {
      const pathname = new URL(url).pathname
      const rawName = pathname.split('/').pop() || 'image.jpg'
      const cleanName = decodeURIComponent(rawName).slice(0, 40)
      return {
        title: cleanName || 'High Resolution Image',
        platform: 'Direct Image',
        thumbnail: url,
        uploader: 'Image Source',
        qualities: ['Original HD Image'],
        streamUrl: url,
        downloadUrl: url,
        fileType: 'image',
      }
    }
    return null
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
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    const contentType = (headRes.headers.get('content-type') || '').toLowerCase()
    const contentLength = headRes.headers.get('content-length')

    // CRITICAL: Reject HTML / web pages immediately
    if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
      return null
    }

    const isVideo =
      contentType.startsWith('video/') ||
      contentType.includes('application/x-mpegurl') ||
      contentType.includes('application/vnd.apple.mpegurl') ||
      (contentType.includes('octet-stream') && isDirectVideoUrl(url)) ||
      isDirectVideoUrl(url)

    if (!isVideo || !headRes.ok) {
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
    const cleanTitle = decodeURIComponent(rawFileName)
      .replace(/[._-]/g, ' ')
      .replace(/\.[a-z0-9]+$/i, '')

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

// 1. TikTok Dedicated Resolver (TikWM API - 100% Free, High Speed, No Watermark)
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
        qualities: item.hdplay
          ? ['1080p HD (No Watermark)', 'Standard (No Watermark)', 'Audio MP3']
          : ['Standard (No Watermark)', 'Audio MP3'],
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

// 2. Facebook Dedicated Multi-Tier Resolver
export async function resolveFacebook(url: string): Promise<StreamResult | null> {
  try {
    // Engine A: Native Facebook HTML Scraper with realistic navigation headers
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
    })

    if (res.ok) {
      const html = await res.text()

      // Look for progressive MP4 URLs in Facebook page state
      const hdMatch =
        html.match(/browser_native_hd_url["']\s*:\s*["']([^"']+)["']/i) ||
        html.match(/playable_url_quality_hd["']\s*:\s*["']([^"']+)["']/i) ||
        html.match(/hd_src["']\s*:\s*["']([^"']+)["']/i)

      const sdMatch =
        html.match(/browser_native_sd_url["']\s*:\s*["']([^"']+)["']/i) ||
        html.match(/playable_url["']\s*:\s*["']([^"']+)["']/i) ||
        html.match(/sd_src["']\s*:\s*["']([^"']+)["']/i) ||
        html.match(/<meta\s+property="og:video(?::secure_url)?"\s+content="([^"]+)"/i)

      const titleMatch =
        html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
        html.match(/<title>([^<]+)<\/title>/i)

      const thumbMatch =
        html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
        html.match(/preferred_thumbnail["']\s*:\s*\{["']image["']\s*:\s*\{["']uri["']\s*:\s*["']([^"']+)["']/i)

      const hdUrl = hdMatch ? cleanEscapedUrl(hdMatch[1]) : null
      const sdUrl = sdMatch ? cleanEscapedUrl(sdMatch[1]) : null
      const rawTitle = titleMatch ? titleMatch[1].trim() : 'Facebook Video'
      const cleanTitle = rawTitle.replace(/ \| Facebook$/i, '').trim()
      const thumbnail = thumbMatch ? cleanEscapedUrl(thumbMatch[1]) : undefined

      const selectedUrl = hdUrl || sdUrl

      if (selectedUrl && selectedUrl.startsWith('http')) {
        return {
          title: cleanTitle && cleanTitle !== 'Facebook' ? cleanTitle : 'Facebook HD Video',
          platform: 'Facebook',
          thumbnail,
          uploader: 'Facebook Creator',
          qualities: hdUrl ? ['1080p / 720p HD', 'Standard Quality', 'Audio MP3'] : ['Standard Quality', 'Audio MP3'],
          streamUrl: selectedUrl,
          downloadUrl: selectedUrl,
          audioUrl: undefined,
        }
      }

      // If post is a Facebook Photo / Image instead of video
      if (!selectedUrl && thumbnail && thumbnail.startsWith('http')) {
        return {
          title: cleanTitle && cleanTitle !== 'Facebook' ? cleanTitle : 'Facebook Photo',
          platform: 'Facebook',
          thumbnail,
          uploader: 'Facebook Creator',
          qualities: ['High Resolution Image', 'Standard JPEG'],
          streamUrl: thumbnail,
          downloadUrl: thumbnail,
          fileType: 'image',
        }
      }
    }
  } catch (err) {
    console.warn('[Facebook Native Scrape Warn]:', err)
  }

  // Engine B: btch-downloader fallback
  try {
    const btchMod = await import('btch-downloader')
    const btch = btchMod.default || btchMod
    if (typeof btch?.fbdown === 'function') {
      const fbRes = await btch.fbdown(url)
      const downloadUrl = fbRes.HD || fbRes.Normal_video
      if (downloadUrl) {
        return {
          title: 'Facebook HD Video',
          platform: 'Facebook',
          qualities: fbRes.HD ? ['1080p / 720p HD', 'Standard Quality'] : ['Standard Quality'],
          streamUrl: downloadUrl,
          downloadUrl: downloadUrl,
          uploader: 'Facebook Creator',
        }
      }
    }
  } catch (err) {
    console.warn('[Facebook Fallback Engine Warn]:', err)
  }

  return null
}

// 3. Instagram Dedicated Multi-Tier Resolver
export async function resolveInstagram(url: string): Promise<StreamResult | null> {
  const cleanUrl = url.split('?')[0].trim()
  const shortcodeMatch = cleanUrl.match(/(?:reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/)
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : null

  // Engine A: ruhend-scraper igdl
  try {
    const ruhendMod = await import('ruhend-scraper')
    const ruhend = ruhendMod.default || ruhendMod
    if (typeof ruhend?.igdl === 'function') {
      const igRes = await ruhend.igdl(cleanUrl)
      if (Array.isArray(igRes) && igRes.length > 0 && typeof igRes[0] === 'string' && igRes[0].startsWith('http')) {
        const videoUrl = igRes[0]
        return {
          title: `Instagram Reel (${shortcode || 'Video'})`,
          platform: 'Instagram',
          thumbnail: '',
          uploader: 'Instagram Creator',
          qualities: ['1080p Full HD', '720p HD', 'Audio MP3'],
          streamUrl: videoUrl,
          downloadUrl: videoUrl,
          audioUrl: videoUrl,
        }
      }
    }
  } catch (err) {
    console.warn('[Instagram ruhend.igdl warn]:', err)
  }

  // Engine B: ruhend-scraper igdl2
  try {
    const ruhendMod = await import('ruhend-scraper')
    const ruhend = ruhendMod.default || ruhendMod
    if (typeof ruhend?.igdl2 === 'function') {
      const igRes2 = await ruhend.igdl2(cleanUrl)
      if (igRes2?.status && Array.isArray(igRes2?.data) && igRes2.data.length > 0) {
        const item = igRes2.data[0]
        const videoUrl = item.url
        if (videoUrl) {
          return {
            title: `Instagram Reel (${shortcode || 'Video'})`,
            platform: 'Instagram',
            thumbnail: item.thumbnail || '',
            uploader: 'Instagram Creator',
            qualities: ['1080p Full HD', '720p HD', 'Audio MP3'],
            streamUrl: videoUrl,
            downloadUrl: videoUrl,
            audioUrl: videoUrl,
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Instagram ruhend.igdl2 warn]:', err)
  }

  // Engine C: btch-downloader igdl
  try {
    const btchMod = await import('btch-downloader')
    const btch = btchMod.default || btchMod
    if (typeof btch?.igdl === 'function') {
      const btchRes = await btch.igdl(cleanUrl)
      if (btchRes?.status && Array.isArray(btchRes?.result) && btchRes.result.length > 0) {
        const item = btchRes.result[0]
        const videoUrl = item.url
        if (videoUrl) {
          return {
            title: `Instagram Video (${shortcode || 'Reel'})`,
            platform: 'Instagram',
            thumbnail: item.thumbnail || '',
            uploader: 'Instagram Creator',
            qualities: ['1080p Full HD', '720p HD', 'Audio MP3'],
            streamUrl: videoUrl,
            downloadUrl: videoUrl,
            audioUrl: videoUrl,
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Instagram btch.igdl warn]:', err)
  }

  // Engine D: Local yt-dlp
  try {
    const { exec } = await import('child_process')
    const p = new Promise<StreamResult | null>((resolve) => {
      exec(`python -m yt_dlp --dump-json --no-warnings "${cleanUrl}"`, { maxBuffer: 10 * 1024 * 1024, timeout: 12000 }, (err, stdout) => {
        if (err || !stdout) return resolve(null)
        try {
          const d = JSON.parse(stdout)
          if (d.url) {
            resolve({
              title: d.title || `Instagram Video (${shortcode || 'Reel'})`,
              platform: 'Instagram',
              thumbnail: d.thumbnail || '',
              uploader: d.uploader || 'Instagram Creator',
              qualities: ['1080p Full HD', '720p HD', 'Audio MP3'],
              streamUrl: d.url,
              downloadUrl: d.url,
              audioUrl: d.url,
            })
          } else {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      })
    })
    const ytDlpRes = await p
    if (ytDlpRes) return ytDlpRes
  } catch (err) {
    console.warn('[Instagram yt-dlp warn]:', err)
  }

  // Engine E: Embed Scraper for public posts
  if (shortcode) {
    try {
      const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`
      const res = await fetch(embedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(6000),
      })

      if (res.ok) {
        const html = await res.text()
        const videoMatch =
          html.match(/video_url["']\s*:\s*["']([^"']+)["']/i) ||
          html.match(/<video[^>]+src="([^">]+)"/i)

        const titleMatch = html.match(/class="Caption"[^>]*>([\s\S]*?)<\/div>/i)
        const thumbMatch = html.match(/display_url["']\s*:\s*["']([^"']+)["']/i)

        if (videoMatch) {
          const videoUrl = cleanEscapedUrl(videoMatch[1])
          return {
            title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 60) : `Instagram Reel (${shortcode})`,
            platform: 'Instagram',
            thumbnail: thumbMatch ? cleanEscapedUrl(thumbMatch[1]) : undefined,
            uploader: 'Instagram Creator',
            qualities: ['1080p Full HD', '720p HD', 'Audio MP3'],
            streamUrl: videoUrl,
            downloadUrl: videoUrl,
            audioUrl: videoUrl,
          }
        }

        // Instagram Photo / Image extraction
        const imgMatch =
          thumbMatch ||
          html.match(/<img[^>]+class="[^"]*EmbeddedMediaImage[^"]*"[^>]+src="([^">]+)"/i) ||
          html.match(/<img[^>]+src="([^">]+)"[^>]+class="[^"]*EmbeddedMediaImage/i) ||
          html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)

        if (imgMatch) {
          const imgUrl = cleanEscapedUrl(imgMatch[1])
          if (imgUrl && imgUrl.startsWith('http')) {
            return {
              title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 60) : `Instagram Photo (${shortcode || 'Post'})`,
              platform: 'Instagram',
              thumbnail: imgUrl,
              uploader: 'Instagram Creator',
              qualities: ['High Resolution Image', 'Standard JPEG'],
              streamUrl: imgUrl,
              downloadUrl: imgUrl,
              fileType: 'image',
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Instagram Embed Warn]:', err)
    }
  }

  throw new Error('This Instagram post is private or inaccessible without login. Please ensure the link is public and accessible.')
}

// Helper to parse yt-dlp metadata for YouTube
function parseYouTubeYtDlp(d: any): StreamResult {
  const title = d.title || 'YouTube Video'
  const thumbnail = d.thumbnail || (d.thumbnails && d.thumbnails[d.thumbnails.length - 1]?.url) || ''
  const duration = d.duration
    ? `${Math.floor(d.duration / 60)}:${String(d.duration % 60).padStart(2, '0')}`
    : undefined
  const uploader = d.uploader || d.channel || 'YouTube Creator'

  const formatsWithUrl = (d.formats || []).filter((f: any) => f.url && f.url.startsWith('http'))

  // 1. Progressive video formats (contains BOTH video and audio)
  const progressive = formatsWithUrl.filter(
    (f: any) => f.vcodec !== 'none' && f.acodec !== 'none'
  )
  progressive.sort((a: any, b: any) => (b.height || 0) - (a.height || 0))

  // 2. Separate video formats
  const videoOnly = formatsWithUrl.filter((f: any) => f.vcodec !== 'none')
  videoOnly.sort((a: any, b: any) => (b.height || 0) - (a.height || 0))

  // 3. Audio-only formats (e.g. itag 140 m4a / itag 251 opus)
  const audioOnly = formatsWithUrl.filter(
    (f: any) => f.vcodec === 'none' && f.acodec !== 'none'
  )
  audioOnly.sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))

  // Select best video stream (prefer progressive format with audio for seamless playback)
  const bestVideo = progressive[0] || videoOnly[0] || formatsWithUrl[0]
  // Select best audio stream for MP3 download
  const bestAudio = audioOnly[0] || progressive[0] || bestVideo

  const qualities: string[] = []
  if (videoOnly.some((f: any) => (f.height || 0) >= 1080)) {
    qualities.push('1080p Full HD')
  }
  if (progressive.some((f: any) => (f.height || 0) >= 720) || videoOnly.some((f: any) => (f.height || 0) >= 720)) {
    qualities.push('720p HD')
  }
  qualities.push('360p Standard')
  qualities.push('Audio Only')

  return {
    title,
    thumbnail,
    duration,
    uploader,
    platform: 'YouTube',
    qualities,
    streamUrl: bestVideo?.url,
    downloadUrl: bestVideo?.url,
    audioUrl: bestAudio?.url,
  }
}

// Sanitize incoming media URL by stripping tracking parameters, zero-width spaces, and quotes
export function sanitizeMediaUrl(url: string): string {
  if (!url) return ''
  let cleaned = url.trim()
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim()

  try {
    const parsed = new URL(cleaned)
    const trackingParams = ['si', 'utm_source', 'utm_medium', 'utm_campaign', 'feature', 'stkn', 'fbclid', 'igsh']
    trackingParams.forEach(p => parsed.searchParams.delete(p))
    return parsed.toString()
  } catch {
    return cleaned
  }
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const trimmed = url.trim().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/^["']|["']$/g, '')
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|embed|watch|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
    const match = trimmed.match(regex)
    if (match && match[1]) return match[1]

    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
      const v = parsed.searchParams.get('v')
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
    } catch {}

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
    return null
  } catch {
    return null
  }
}

// 4. YouTube Dedicated Multi-Tier Serverless Resolver
export async function resolveYouTube(url: string): Promise<StreamResult | null> {
  const cleanUrl = sanitizeMediaUrl(url)
  const videoId = extractYouTubeVideoId(cleanUrl)
  const canonicalUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : cleanUrl

  // Engine A: Movanest / SaveTube Cloudflare CDN API (100% Serverless & Vercel compatible)
  try {
    const apiUrl = `https://www.movanest.xyz/v2/ytdown?url=${encodeURIComponent(canonicalUrl)}`
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (res.ok) {
      const data = await res.json()
      if (data?.status) {
        const formats: any[] = Array.isArray(data.formats) ? data.formats : []
        const videoFormats = formats.filter((f: any) => f.type === 'video' && f.url)
        const audioFormats = formats.filter((f: any) => f.type === 'audio' && f.url)

        // Sort video formats by quality descending (e.g. 2160, 1440, 1080, 720, 480, 360)
        videoFormats.sort((a: any, b: any) => (Number(b.quality) || 0) - (Number(a.quality) || 0))

        const bestVideo = videoFormats[0] || (data.download?.link ? { url: data.download.link, label: data.download.label } : null)
        const bestAudio = audioFormats[0] || bestVideo

        if (bestVideo?.url || bestAudio?.url) {
          const qualities: string[] = []
          videoFormats.forEach((f: any) => {
            const lbl = f.label || (f.quality ? `${f.quality}p` : 'MP4')
            if (!qualities.includes(lbl)) qualities.push(lbl)
          })
          if (!qualities.some(q => q.includes('720'))) qualities.push('720p HD')
          qualities.push('Audio Only')

          const durationSec = typeof data.duration === 'number' ? data.duration : parseInt(data.duration, 10) || undefined
          const durationStr = durationSec
            ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}`
            : undefined
          const thumb = data.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '')

          return {
            title: data.title || 'YouTube Video',
            thumbnail: thumb,
            duration: durationStr,
            uploader: 'YouTube Creator',
            platform: 'YouTube',
            qualities,
            streamUrl: bestVideo?.url || bestAudio?.url,
            downloadUrl: bestVideo?.url || bestAudio?.url,
            audioUrl: bestAudio?.url || bestVideo?.url,
          }
        }
      }
    }
  } catch (err) {
    console.warn('[YouTube Movanest Engine Warn]:', err)
  }

  // Engine B: SaveTube VIP CDN with AES-128 Decryption
  if (videoId) {
    try {
      const { createDecipheriv } = await import('crypto')
      const KEY = Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex')
      const headers = {
        'Content-Type': 'application/json',
        Origin: 'https://yt.savetube.me',
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36',
      }

      const cdnRes = await fetch('https://media.savetube.vip/api/random-cdn', {
        headers,
        signal: AbortSignal.timeout(6000),
      })
        .then(r => r.json())
        .catch(() => null)

      const cdn = cdnRes?.cdn || 'cdn401.savetube.vip'

      const infoRes = await fetch(`https://${cdn}/v2/info`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}` }),
        signal: AbortSignal.timeout(8000),
      })
        .then(r => r.json())
        .catch(() => null)

      if (infoRes?.data) {
        const enc = Buffer.from(infoRes.data, 'base64')
        const iv = enc.subarray(0, 16)
        const cipherText = enc.subarray(16)
        const decipher = createDecipheriv('aes-128-cbc', KEY, iv)
        const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()])
        const meta = JSON.parse(decrypted.toString('utf8'))

        if (meta?.key) {
          const [videoDl, audioDl] = await Promise.all([
            fetch(`https://${cdn}/download`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ id: videoId, downloadType: 'video', quality: '720', key: meta.key }),
              signal: AbortSignal.timeout(8000),
            })
              .then(r => r.json())
              .catch(() => null),
            fetch(`https://${cdn}/download`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ id: videoId, downloadType: 'audio', quality: '128', key: meta.key }),
              signal: AbortSignal.timeout(8000),
            })
              .then(r => r.json())
              .catch(() => null),
          ])

          const videoUrl = videoDl?.data?.downloadUrl
          const audioUrl = audioDl?.data?.downloadUrl || videoUrl

          if (videoUrl || audioUrl) {
            return {
              title: meta.title || 'YouTube Video',
              thumbnail: meta.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              duration: meta.durationLabel,
              uploader: 'YouTube Creator',
              platform: 'YouTube',
              qualities: ['1080p Full HD', '720p HD', '360p Standard', 'Audio Only'],
              streamUrl: videoUrl || audioUrl,
              downloadUrl: videoUrl || audioUrl,
              audioUrl: audioUrl || videoUrl,
            }
          }
        }
      }
    } catch (err) {
      console.warn('[YouTube SaveTube Direct Warn]:', err)
    }
  }

  // Engine C: Invidious Multi-Node Public Instances (Zero Serverless Dependencies)
  if (videoId) {
    const invidiousInstances = [
      'https://invidious.nerdvpn.de',
      'https://inv.nadeko.net',
      'https://invidious.private.coffee',
      'https://iv.ggtyler.dev',
      'https://invidious.jing.rocks',
    ]

    for (const inst of invidiousInstances) {
      try {
        const invRes = await fetch(`${inst}/api/v1/videos/${videoId}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          },
          signal: AbortSignal.timeout(4500),
        })

        if (invRes.ok) {
          const d = await invRes.json()
          if (d && (d.formatStreams || d.adaptiveFormats)) {
            const prog = d.formatStreams || []
            const adapt = d.adaptiveFormats || []
            const bestProg = prog[0] || adapt.find((f: any) => f.type?.includes('video/mp4'))
            const bestAud = adapt.find((f: any) => f.type?.includes('audio')) || bestProg

            if (bestProg?.url || bestAud?.url) {
              const dur = d.lengthSeconds
                ? `${Math.floor(d.lengthSeconds / 60)}:${String(d.lengthSeconds % 60).padStart(2, '0')}`
                : undefined
              return {
                title: d.title || 'YouTube Video',
                thumbnail: d.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                duration: dur,
                uploader: d.author || 'YouTube Creator',
                platform: 'YouTube',
                qualities: ['720p HD', '360p Standard', 'Audio Only'],
                streamUrl: bestProg?.url || bestAud?.url,
                downloadUrl: bestProg?.url || bestAud?.url,
                audioUrl: bestAud?.url || bestProg?.url,
              }
            }
          }
        }
      } catch {
        // Continue to next node
      }
    }
  }

  // Engine D: Local / host yt-dlp extractor (for local development or environments with python/yt-dlp)
  try {
    const { exec } = await import('child_process')
    const p = new Promise<StreamResult | null>((resolve) => {
      const cmd = `python -m yt_dlp --dump-json --no-warnings --extractor-args "youtube:player_client=android,web,tv" "${canonicalUrl}"`
      exec(cmd, { maxBuffer: 20 * 1024 * 1024, timeout: 15000 }, (err, stdout) => {
        if (err || !stdout) {
          exec(`yt-dlp --dump-json --no-warnings "${canonicalUrl}"`, { maxBuffer: 20 * 1024 * 1024, timeout: 15000 }, (err2, stdout2) => {
            if (err2 || !stdout2) return resolve(null)
            try {
              resolve(parseYouTubeYtDlp(JSON.parse(stdout2)))
            } catch {
              resolve(null)
            }
          })
          return
        }
        try {
          resolve(parseYouTubeYtDlp(JSON.parse(stdout)))
        } catch {
          resolve(null)
        }
      })
    })

    const ytRes = await p
    if (ytRes) return ytRes
  } catch (err) {
    console.warn('[YouTube yt-dlp error]:', err)
  }

  // Engine E: ruhend-scraper search fallback
  try {
    const ruhendMod = await import('ruhend-scraper')
    const ruhend = ruhendMod.default || ruhendMod
    if (typeof ruhend?.ytsearch === 'function') {
      const searchRes = await ruhend.ytsearch(canonicalUrl)
      const first = searchRes?.video?.[0]
      if (first) {
        return {
          title: first.title || 'YouTube Video',
          thumbnail: first.thumbnail || '',
          duration: first.duration || `${first.durationS || 0}s`,
          uploader: first.authorName || 'YouTube Creator',
          platform: 'YouTube',
          qualities: ['720p HD', '360p Standard', 'Audio Only'],
          streamUrl: first.url || canonicalUrl,
          downloadUrl: first.url || canonicalUrl,
          audioUrl: first.url || canonicalUrl,
        }
      }
    }
  } catch (err) {
    console.warn('[YouTube ruhend fallback warn]:', err)
  }

  return null
}

// 5. Twitter / X Dedicated Resolver
export async function resolveTwitter(url: string): Promise<StreamResult | null> {
  const statusMatch = url.match(/status\/(\d+)/)
  const tweetId = statusMatch ? statusMatch[1] : null

  if (tweetId) {
    // Engine A: FxTwitter API
    try {
      const fxRes = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
        headers: {
          'User-Agent': 'UniDownloader/2.0',
        },
        signal: AbortSignal.timeout(6000),
      })
      if (fxRes.ok) {
        const data = await fxRes.json()
        const tweet = data.tweet
        if (tweet?.media?.videos && tweet.media.videos.length > 0) {
          const video = tweet.media.videos[0]
          return {
            title: tweet.text ? tweet.text.slice(0, 60) : `Twitter Video (${tweetId})`,
            platform: 'Twitter / X',
            thumbnail: video.thumbnail_url || tweet.media.photos?.[0]?.url,
            uploader: tweet.author?.name || tweet.author?.screen_name || 'X User',
            qualities: ['Original MP4 HD', 'Standard Quality', 'Audio MP3'],
            streamUrl: video.url,
            downloadUrl: video.url,
          }
        }
      }
    } catch (err) {
      console.warn('[Twitter FxTwitter Warn]:', err)
    }
  }

  return null
}

// 6. Snapchat Dedicated Resolver (Spotlight & Stories)
export async function resolveSnapchat(url: string): Promise<StreamResult | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return null
    const html = await res.text()

    // 1. Check __NEXT_DATA__
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    let videoUrl = ''
    let thumbUrl = ''
    let title = ''

    if (nextDataMatch) {
      try {
        const parsed = JSON.parse(nextDataMatch[1])
        const jsonStr = JSON.stringify(parsed)

        const videoMatch =
          jsonStr.match(/https:\\?\/\\?\/cf-st\.sc-cdn\.net\\?\/d\\?\/[a-zA-Z0-9._-]+\.27\.[a-zA-Z0-9._-]+[^"'\\]*/i) ||
          jsonStr.match(/https:\\?\/\\?\/[^"'\\]*(?:cf-st\.sc-cdn\.net|media\.snapchat\.com)[^"'\\]*SpotlightSharing[^"'\\]*/i) ||
          jsonStr.match(/https:\\?\/\\?\/[^"'\\]*(?:cf-st\.sc-cdn\.net|media\.snapchat\.com)[^"'\\]*\.mp4[^"'\\]*/i)

        if (videoMatch) {
          videoUrl = videoMatch[0].replace(/\\u0026/g, '&').replace(/\\\//g, '/')
        }

        const thumbMatch = jsonStr.match(
          /https:\\?\/\\?\/cf-st\.sc-cdn\.net\\?\/d\\?\/[a-zA-Z0-9._-]+\.256\.[a-zA-Z0-9._-]+[^"'\\]*/i
        )
        if (thumbMatch) {
          thumbUrl = thumbMatch[0].replace(/\\u0026/g, '&').replace(/\\\//g, '/')
        }

        title =
          parsed.props?.pageProps?.curatedStoryResponse?.storyMetadata?.title ||
          parsed.props?.pageProps?.spotlightHighlight?.title ||
          ''
      } catch {}
    }

    // 2. Fallback regex on HTML directly
    if (!videoUrl) {
      const vMatch =
        html.match(/https:\/\/(?:cf-st\.sc-cdn\.net|media\.snapchat\.com)\/[^"'\s]*\.(?:mp4|27\.)[^"'\s]*/i) ||
        html.match(/https:\/\/cf-st\.sc-cdn\.net\/d\/[^"'\s]*SpotlightSharing[^"'\s]*/i)
      if (vMatch) videoUrl = vMatch[0].replace(/&amp;/g, '&')
    }

    if (!title) {
      const tMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
      title = tMatch ? tMatch[1] : 'Snapchat Spotlight Video'
    }

    if (!thumbUrl) {
      const imMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
      thumbUrl = imMatch ? imMatch[1] : ''
    }

    if (videoUrl) {
      return {
        title: title.slice(0, 60),
        thumbnail: thumbUrl,
        downloadUrl: videoUrl,
        streamUrl: videoUrl,
        platform: 'Snapchat',
        qualities: ['Original HD MP4', 'Audio MP3'],
      }
    }
  } catch (err) {
    console.warn('[Snapchat Resolver Error]:', err)
  }
  return null
}

// 7. Twitch Dedicated Resolver (Clips & VODs)
export async function resolveTwitch(url: string): Promise<StreamResult | null> {
  try {
    let slug = ''
    const cleanUrl = url.trim()

    if (cleanUrl.includes('clips.twitch.tv/')) {
      slug = cleanUrl.split('clips.twitch.tv/')[1]?.split(/[?#]/)[0] || ''
    } else if (cleanUrl.includes('/clip/')) {
      slug = cleanUrl.split('/clip/')[1]?.split(/[?#]/)[0] || ''
    }

    if (!slug) return null

    // Engine A: Twitch Embed page inspection
    try {
      const embedRes = await fetch(`https://clips.twitch.tv/embed?clip=${slug}&parent=localhost`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(6000),
      })

      if (embedRes.ok) {
        const html = await embedRes.text()
        const imgMatch =
          html.match(/<meta\s+(?:property|name)=["'](?:og:image|twitter:image)["']\s+content=["']([^"']+)["']/i)
        const titleMatch =
          html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
          html.match(/<title>([^<]+)<\/title>/i)

        if (imgMatch && imgMatch[1]) {
          const thumbUrl = imgMatch[1]
          const mp4Url = thumbUrl.replace(/-preview-.*\.jpg$/i, '.mp4')
          return {
            title: titleMatch ? titleMatch[1].replace(/ - Twitch$/, '') : `Twitch Clip (${slug})`,
            thumbnail: thumbUrl,
            streamUrl: mp4Url,
            downloadUrl: mp4Url,
            platform: 'Twitch',
            qualities: ['1080p Full HD', '720p HD', 'Audio MP3'],
          }
        }
      }
    } catch (e) {
      console.warn('[Twitch Embed Warn]:', e)
    }

    // Engine B: Twitch GQL query
    try {
      const query = {
        query: `query {
          clip(slug: "${slug}") {
            title
            thumbnailURL
            durationSeconds
            broadcaster { displayName }
            videoQualities {
              quality
              sourceURL
            }
          }
        }`,
      }

      const gqlRes = await fetch('https://gql.twitch.tv/gql', {
        method: 'POST',
        headers: {
          'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
        signal: AbortSignal.timeout(5000),
      })

      if (gqlRes.ok) {
        const d = await gqlRes.json()
        const clip = d?.data?.clip
        if (clip) {
          const qualities = clip.videoQualities || []
          const best = qualities[0]
          const streamUrl = best?.sourceURL || clip.thumbnailURL?.replace(/-preview-.*\.jpg$/, '.mp4')
          if (streamUrl) {
            return {
              title: clip.title || `Twitch Clip (${slug})`,
              thumbnail: clip.thumbnailURL,
              duration: clip.durationSeconds ? `${clip.durationSeconds}s` : undefined,
              uploader: clip.broadcaster?.displayName || 'Twitch Streamer',
              platform: 'Twitch',
              qualities: qualities.map((q: any) => `${q.quality}p HD`).concat(['Audio MP3']),
              streamUrl,
              downloadUrl: streamUrl,
            }
          }
        }
      }
    } catch {}
  } catch (err) {
    console.warn('[Twitch Resolver Error]:', err)
  }
  return null
}

// 8. Reddit Dedicated Resolver
export async function resolveReddit(url: string): Promise<StreamResult | null> {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Engine A: vxreddit crawler proxy
    try {
      const vxUrl = `https://vxreddit.com${pathname}`
      const vxRes = await fetch(vxUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discord.app)',
        },
        signal: AbortSignal.timeout(7000),
        redirect: 'follow',
      })

      if (vxRes.ok) {
        const html = await vxRes.text()
        const videoMatch =
          html.match(/<meta\s+(?:property|name)=["'](?:og:video(?::secure_url)?|twitter:player:stream)["']\s+content=["']([^"']+)["']/i)
        const titleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i)
        const thumbMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i)

        if (videoMatch && videoMatch[1]) {
          const videoUrl = videoMatch[1].replace(/&amp;/g, '&')
          return {
            title: titleMatch ? titleMatch[1].slice(0, 70) : 'Reddit Video',
            thumbnail: thumbMatch ? thumbMatch[1].replace(/&amp;/g, '&') : '',
            downloadUrl: videoUrl,
            streamUrl: videoUrl,
            platform: 'Reddit',
            qualities: ['HD Video', 'Standard Video', 'Audio MP3'],
          }
        }
      }
    } catch (e) {
      console.warn('[Reddit vxreddit warn]:', e)
    }

    // Engine B: RapidSave proxy inspection
    try {
      const rsUrl = `https://rapidsave.com/info?url=${encodeURIComponent(url)}`
      const rsRes = await fetch(rsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(8000),
      })
      if (rsRes.ok) {
        const rsHtml = await rsRes.text()
        const dlBtn =
          rsHtml.match(/href=["'](https?:\/\/[^"']*(?:rapidsave\.com|redditsave\.com)[^"']*download[^"']*)["']/i) ||
          rsHtml.match(/href=["'](https?:\/\/[^"']+\.mp4[^"']*)["']/i)
        const titleMatch =
          rsHtml.match(/class=["']font-bold[^"']*["']>([^<]+)<\//i) ||
          rsHtml.match(/<title>([^<]+)<\/title>/i)

        if (dlBtn && dlBtn[1]) {
          return {
            title: titleMatch ? titleMatch[1].trim().slice(0, 70) : 'Reddit Video',
            downloadUrl: dlBtn[1],
            streamUrl: dlBtn[1],
            platform: 'Reddit',
            qualities: ['HD Video', 'Audio MP3'],
          }
        }
      }
    } catch (e) {
      console.warn('[Reddit RapidSave warn]:', e)
    }
  } catch (err) {
    console.warn('[Reddit Resolver Error]:', err)
  }
  return null
}

// 9. Universal Web Movie & Embedded Video Stream Extractor for Any Site
export async function resolveWebMovie(url: string): Promise<StreamResult | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    })

    if (!res.ok) return null
    const contentType = (res.headers.get('content-type') || '').toLowerCase()

    // If URL directly serves a video file
    if (contentType.startsWith('video/') || contentType.includes('mpegurl') || contentType.includes('octet-stream')) {
      const contentLength = res.headers.get('content-length')
      let sizeStr = ''
      if (contentLength) {
        const bytes = parseInt(contentLength, 10)
        if (!isNaN(bytes)) {
          sizeStr =
            bytes >= 1024 * 1024 * 1024
              ? `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
              : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        }
      }
      const rawName = new URL(url).pathname.split('/').pop() || 'Movie Stream'
      return {
        title: decodeURIComponent(rawName).replace(/\.[a-z0-9]+$/i, '').replace(/[._-]/g, ' ') || 'Movie Stream',
        platform: 'Direct Movie Stream',
        qualities: ['Original Quality', 'HD Stream', 'Audio Only'],
        streamUrl: url,
        downloadUrl: url,
        isDirectMovie: true,
        fileSize: sizeStr || 'High Bitrate Stream',
      }
    }

    // Parse HTML web page containing a video player
    const html = await res.text()
    const cleanStr = (s: string) =>
      s ? s.replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/&amp;/g, '&').trim() : ''

    // 1. OpenGraph / Twitter video meta tags
    const ogVideo =
      html.match(/<meta\s+(?:property|name)=["'](?:og:video(?::secure_url)?|og:video:url|twitter:player:stream)["']\s+content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["']\s+<meta\s+(?:property|name)=["'](?:og:video(?::secure_url)?|og:video:url|twitter:player:stream)["']/i)

    // 2. HTML5 <video> and <source> tags
    const videoTag =
      html.match(/<video[^>]*\ssrc=["']([^"']+)["']/i) ||
      html.match(/<source[^>]*\ssrc=["']([^"']+\.(?:mp4|webm|mkv|m3u8)[^"']*)["']/i) ||
      html.match(/<source[^>]*\ssrc=["']([^"']+)["']/i)

    // 3. Player configs / script JSON
    const scriptVideo =
      html.match(/(?:file|source|src|videoUrl|hlsUrl|streamUrl)["']?\s*:\s*["'](https?:\\?\/\\?\/[^"']+\.(?:mp4|webm|mkv|m3u8)[^"']*)["']/i) ||
      html.match(/["'](https?:\\?\/\\?\/[^"']+\.(?:mp4|mkv|webm|m3u8)(?:\?[^"']*)?)["']/i)

    let rawStreamUrl = ogVideo?.[1] || videoTag?.[1] || scriptVideo?.[1]

    // 4. Iframe embed check (e.g. streamtape, doodstream, vidsrc, player embeds)
    if (!rawStreamUrl) {
      const iframeMatch = html.match(
        /<iframe[^>]*\ssrc=["'](https?:\\?\/\\?\/[^"']*(?:embed|player|stream|video)[^"']*)["']/i
      )
      if (iframeMatch) {
        try {
          const iframeUrl = cleanStr(iframeMatch[1])
          const subRes = await fetch(new URL(iframeUrl, url).toString(), {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': url,
            },
            signal: AbortSignal.timeout(6000),
          })
          if (subRes.ok) {
            const subHtml = await subRes.text()
            const subVideo = subHtml.match(/["'](https?:\\?\/\\?\/[^"']+\.(?:mp4|mkv|webm|m3u8)[^"']*)["']/i)
            if (subVideo) rawStreamUrl = subVideo[1]
          }
        } catch {}
      }
    }

    if (!rawStreamUrl) return null

    rawStreamUrl = cleanStr(rawStreamUrl)
    const absStreamUrl = new URL(rawStreamUrl, url).toString()

    // Title
    const titleMatch =
      html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].replace(/ - [^-]+$/, '').trim() : 'Web Movie Stream'

    // Thumbnail / Poster
    const thumbMatch =
      html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/poster=["']([^"']+)["']/i)
    const thumbnail = thumbMatch ? new URL(cleanStr(thumbMatch[1]), url).toString() : ''

    return {
      title,
      thumbnail,
      downloadUrl: absStreamUrl,
      streamUrl: absStreamUrl,
      platform: 'Web Movie Stream',
      qualities: ['Original Quality', 'HD Web Stream', 'Audio Only'],
      isDirectMovie: true,
      fileSize: 'High Bitrate Stream',
    }
  } catch (err) {
    console.warn('[Web Movie Extractor Error]:', err)
  }
  return null
}

// Universal Resolver orchestrator
export async function resolveMediaUrl(url: string): Promise<StreamResult> {
  const trimmedUrl = sanitizeMediaUrl(url)

  // 1. YouTube Dedicated High-Speed Video & Audio Resolver
  if (isYouTubeUrl(trimmedUrl)) {
    const ytResult = await resolveYouTube(trimmedUrl)
    if (ytResult) return ytResult
    throw new Error('Unable to extract YouTube video. Please ensure the link is public and accessible.')
  }

  // 2. Direct Movie / Video file inspection
  if (isDirectVideoUrl(trimmedUrl)) {
    const directResult = await inspectDirectVideo(trimmedUrl)
    if (directResult) return directResult
  }

  // 2b. Direct Image file inspection
  if (isDirectImageUrl(trimmedUrl)) {
    const directImg = await inspectDirectImage(trimmedUrl)
    if (directImg) return directImg
  }

  // 3. TikTok Dedicated High-Speed Resolver
  if (trimmedUrl.includes('tiktok.com')) {
    const tiktokResult = await resolveTikTok(trimmedUrl)
    if (tiktokResult) return tiktokResult
  }

  // 4. Facebook Dedicated Resolver
  if (
    trimmedUrl.includes('facebook.com') ||
    trimmedUrl.includes('fb.watch') ||
    trimmedUrl.includes('fb.com')
  ) {
    const fbResult = await resolveFacebook(trimmedUrl)
    if (fbResult) return fbResult
  }

  // 5. Instagram Dedicated Resolver
  if (trimmedUrl.includes('instagram.com')) {
    const igResult = await resolveInstagram(trimmedUrl)
    if (igResult) return igResult
  }

  // 6. Twitter / X Dedicated Resolver
  if (trimmedUrl.includes('twitter.com') || trimmedUrl.includes('x.com')) {
    const twitterResult = await resolveTwitter(trimmedUrl)
    if (twitterResult) return twitterResult
  }

  // 7. Snapchat Dedicated Resolver (Spotlight & Stories)
  if (trimmedUrl.includes('snapchat.com')) {
    const snapResult = await resolveSnapchat(trimmedUrl)
    if (snapResult) return snapResult
  }

  // 8. Twitch Dedicated Resolver (Clips & VODs)
  if (trimmedUrl.includes('twitch.tv')) {
    const twitchResult = await resolveTwitch(trimmedUrl)
    if (twitchResult) return twitchResult
  }

  // 9. Reddit Dedicated Resolver
  if (trimmedUrl.includes('reddit.com') || trimmedUrl.includes('redd.it')) {
    const redditResult = await resolveReddit(trimmedUrl)
    if (redditResult) return redditResult
  }

  // 10. TeraBox, ShareBox, and Vividcast Folder & Media Resolver
  if (isTeraBoxOrShareBoxUrl(trimmedUrl)) {
    const teraResult = await resolveTeraBoxOrShareBox(trimmedUrl)
    if (teraResult) return teraResult
  }

  // 11. Universal Web Movie & Embedded Video Stream Extractor for Any Site
  const movieResult = await resolveWebMovie(trimmedUrl)
  if (movieResult) return movieResult

  // 12. Final Direct Video Inspect fallback
  const genericInspect = await inspectDirectVideo(trimmedUrl)
  if (genericInspect) return genericInspect

  // 13. Final Direct Image Inspect fallback
  const genericImg = await inspectDirectImage(trimmedUrl)
  if (genericImg) return genericImg

  throw new Error('Unable to resolve media from this link. Please ensure the link is public and accessible.')
}

