import dns from 'dns'
import { isTeraBoxOrShareBoxUrl, resolveTeraBoxOrShareBox, FolderResult } from './terabox-resolver'
try {
  dns.setDefaultResultOrder('ipv4first')
} catch {}

export interface StreamResult {
  title: string
  thumbnail?: string
  duration?: string
  durationSeconds?: number
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
  formats?: Array<{ quality?: string | number; label?: string; url: string; type?: string; audioUrl?: string }>
  images?: Array<{ url: string; thumbnail?: string; title?: string }>
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

      // TikTok Photo Slide / Photo Mode Post
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        const slideImages = item.images.map((img: string, idx: number) => ({
          url: img,
          thumbnail: img,
          title: `Slide ${idx + 1}`,
        }))
        return {
          title: item.title || `TikTok Photo Slide (${item.images.length} Photos)`,
          thumbnail: item.cover || item.images[0],
          uploader: item.author?.nickname || item.author?.unique_id || 'TikTok Creator',
          platform: 'TikTok',
          qualities: ['HD Original Photos', 'Standard JPEG', 'Audio MP3'],
          streamUrl: item.images[0],
          downloadUrl: item.images[0],
          audioUrl: item.music || item.music_info?.play,
          fileType: 'image',
          images: slideImages,
        }
      }

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

// Helper to enforce strict timeouts per scraper tier to avoid serverless function hangs
export function withTimeout<T = any>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    ),
  ])
}

// Decode RapidCDN / SnapSave JWT token URLs to the raw media CDN link
export function extractUrlFromToken(tokenUrl: string): string {
  if (!tokenUrl || typeof tokenUrl !== 'string') return tokenUrl
  try {
    const match = tokenUrl.match(/token=([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/)
    if (!match) return tokenUrl
    const parts = match[1].split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
    return payload.url || tokenUrl
  } catch {
    return tokenUrl
  }
}

// Accurately determine whether a scraped Instagram asset is a video stream
function isLikelyInstagramVideo(urlStr?: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false
  const u = urlStr.toLowerCase()
  if (u.includes('.mp4') || u.includes('.m4v') || u.includes('.mov') || u.includes('.webm')) return true
  if (u.includes('/o1/v/') || u.includes('/v/t16/') || u.includes('/v/t2/')) return true
  if (u.includes('bytestart=') || u.includes('video_url')) return true
  if (u.includes('rapidcdn.app/v2') || u.includes('rapidcdn.app/d') || u.includes('snapxcdn.com/v2')) return true
  return false
}

// 3. Instagram Dedicated Multi-Tier Resolver
export async function resolveInstagram(url: string): Promise<StreamResult | null> {
  const cleanUrl = url.split('?')[0].trim()
  const isReelUrl = /(?:reel|reels|tv)\//i.test(url) || /(?:reel|reels|tv)\//i.test(cleanUrl)
  const shortcodeMatch = cleanUrl.match(/(?:reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/)
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : null
  const isMediaPath = /\/(reel|reels|p|tv|stories|share|s)\//i.test(cleanUrl)
  const reservedIgPaths = [
    'p',
    'reel',
    'reels',
    'tv',
    'stories',
    'explore',
    'direct',
    'share',
    's',
    'accounts',
    'about',
    'legal',
  ]

  // Profile URL detection (e.g. instagram.com/mr.freakline or instagram.com/leomessi)
  // Never treat share/story/media paths as a username.
  if (!shortcode && !isMediaPath) {
    const profileMatch = cleanUrl.match(/(?:instagram\.com\/|^@)([a-zA-Z0-9_.]+)\/?$/i)
    if (profileMatch && !reservedIgPaths.includes(profileMatch[1].toLowerCase())) {
      const username = profileMatch[1]
      try {
        const res = await fetch(`https://www.instagram.com/${username}/`, {
          headers: {
            'User-Agent': 'WhatsApp/2.21.12.21 A',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(6500),
        })

        if (res.ok) {
          const html = await res.text()
          const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
          const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
          const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)

          if (ogImageMatch && ogImageMatch[1]) {
            const avatarUrl = ogImageMatch[1].replace(/&amp;/g, '&')
            const rawTitle = ogTitleMatch ? ogTitleMatch[1].replace(/&#064;/g, '@').replace(/&#x2022;/g, '•') : `@${username}`
            const nameMatch = rawTitle.match(/^([^(•]+)/)
            const displayName = nameMatch ? nameMatch[1].trim() : username

            return {
              title: `${displayName} (@${username}) – Instagram Profile HD Avatar`,
              platform: 'Instagram',
              thumbnail: avatarUrl,
              uploader: `@${username}`,
              qualities: ['Original HD Avatar (1080p)', 'Standard JPEG'],
              streamUrl: avatarUrl,
              downloadUrl: avatarUrl,
              fileType: 'image',
              images: [{ url: avatarUrl, thumbnail: avatarUrl, title: `${displayName} Avatar` }],
            }
          }
        }
      } catch (e) {
        console.warn('[Instagram Profile Stream Resolver warn]:', e)
      }
    }
  }

  // Tier 0: Direct Instagram Embedded Scraper (Googlebot UA - original uncompressed CDN)
  try {
    const directRes = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(6500),
    })

    if (directRes.ok) {
      const html = await directRes.text()
      const scriptRegex = /<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi
      let match
      let mediaNode: any = null

      while ((match = scriptRegex.exec(html)) !== null) {
        const content = match[1]
        if (content.includes('carousel_media') || content.includes('xig_polaris_media') || content.includes('xdt_shortcode_media')) {
          try {
            const json = JSON.parse(content)
            const findMedia = (obj: any) => {
              if (!obj || typeof obj !== 'object') return
              if (obj.carousel_media || (obj.image_versions2 && obj.user)) {
                mediaNode = obj
                return
              }
              if (Array.isArray(obj)) {
                for (const it of obj) {
                  if (mediaNode) return
                  findMedia(it)
                }
              } else {
                for (const k of Object.keys(obj)) {
                  if (mediaNode) return
                  findMedia(obj[k])
                }
              }
            }
            findMedia(json)
            if (mediaNode) break
          } catch {}
        }
      }

      if (mediaNode) {
        const rawCarousel = mediaNode.carousel_media || mediaNode.edge_sidecar_to_children?.edges
        const images: Array<{ url: string; thumbnail?: string; title?: string }> = []

        if (rawCarousel && Array.isArray(rawCarousel) && rawCarousel.length > 0) {
          rawCarousel.forEach((it: any, idx: number) => {
            const n = it.node || it
            const candidates = n.image_versions2?.candidates || []
            const fullUrl = candidates[0]?.url || n.display_uri || n.display_url || ''
            const thumbUrl = candidates.find((c: any) => c.width >= 300 && c.width <= 640)?.url || n.display_uri || fullUrl
            if (fullUrl) {
              images.push({
                url: fullUrl,
                thumbnail: thumbUrl,
                title: `Photo ${idx + 1}`,
              })
            }
          })
        }

        const isVideo = isReelUrl || mediaNode.media_type === 2 || (mediaNode.video_versions && mediaNode.video_versions.length > 0)
        const videoUrl = (mediaNode.video_versions && mediaNode.video_versions[0]?.url) || ''
        const candidates = mediaNode.image_versions2?.candidates || []
        const primaryImg = candidates[0]?.url || mediaNode.display_uri || (images[0]?.url) || ''

        if (isVideo && videoUrl) {
          return {
            title: mediaNode.caption?.text?.slice(0, 70) || (isReelUrl ? `Instagram Reel (${shortcode || 'Video'})` : `Instagram Video (${shortcode || 'Post'})`),
            platform: 'Instagram',
            thumbnail: primaryImg || videoUrl,
            uploader: mediaNode.user?.full_name || mediaNode.user?.username || 'Instagram Creator',
            qualities: ['1080p Full HD', '720p HD', 'Audio MP3'],
            streamUrl: videoUrl,
            downloadUrl: videoUrl,
            audioUrl: videoUrl,
            fileType: 'video',
          }
        }

        if (images.length > 0) {
          return {
            title: images.length > 1 ? `Instagram Photos (${images.length} Images)` : (mediaNode.caption?.text?.slice(0, 70) || `Instagram Photo (${shortcode || 'Post'})`),
            platform: 'Instagram',
            thumbnail: images[0].thumbnail || images[0].url,
            uploader: mediaNode.user?.full_name || mediaNode.user?.username || 'Instagram Creator',
            qualities: ['Original HD Image', 'Standard JPEG'],
            streamUrl: images[0].url,
            downloadUrl: images[0].url,
            fileType: 'image',
            images: images.length > 1 ? images : undefined,
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Instagram Direct Scraper in stream-resolver warn]:', err)
  }

  // Tier 1: snapsave-media-downloader (SnapSave / SnapInsta High-Speed Engine)
  try {
    const snapMod = await import('snapsave-media-downloader')
    const snapsave = (snapMod as any).snapsave || (snapMod as any).default || snapMod
    if (typeof snapsave === 'function') {
      const snapRes = (await withTimeout(
        snapsave(cleanUrl, { retry: 1, retryDelay: 200 }),
        6500
      )) as any
      if (snapRes?.success && snapRes.data?.media && Array.isArray(snapRes.data.media)) {
        const items = snapRes.data.media
          .map((m: any) => ({
            ...m,
            url: extractUrlFromToken(m?.url || ''),
            thumbnail: extractUrlFromToken(m?.thumbnail || '') || m?.thumbnail,
          }))
          .filter((m: any) => m?.url && typeof m.url === 'string' && m.url.startsWith('http'))
        if (items.length > 0) {
          const hasVideo = isReelUrl || items.some((m: any) => m.type === 'video' || (m.type !== 'image' && isLikelyInstagramVideo(m.url)))
          if (hasVideo) {
            const videoItem = items.find((m: any) => m.type === 'video') || items[0]
            const thumb = videoItem.thumbnail || snapRes.data.preview || items[0].thumbnail
            return {
              title: isReelUrl
                ? `Instagram Reel (${shortcode || 'Video'})`
                : `Instagram Video (${shortcode || 'Post'})`,
              platform: 'Instagram',
              thumbnail: thumb,
              uploader: 'Instagram Creator',
              qualities: ['1080p Full HD', '720p HD', 'Audio MP3'],
              streamUrl: videoItem.url,
              downloadUrl: videoItem.url,
              audioUrl: videoItem.url,
              fileType: 'video',
            }
          } else {
            // Instagram Photo or Multi-Photo Carousel
            const gallery = items.map((m: any, idx: number) => ({
              url: m.url,
              thumbnail: m.thumbnail || m.url,
              title: `Photo ${idx + 1}`,
            }))
            const first = items[0]
            return {
              title: items.length > 1
                ? `Instagram Photos (${items.length} Images)`
                : `Instagram Photo (${shortcode || 'Post'})`,
              platform: 'Instagram',
              thumbnail: first.thumbnail || first.url,
              uploader: 'Instagram Creator',
              qualities: ['High Resolution Image', 'Standard JPEG'],
              streamUrl: first.url,
              downloadUrl: first.url,
              fileType: 'image',
              images: gallery.length > 1 ? gallery : undefined,
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Instagram snapsave warn]:', err)
  }

  // Tier 2: ruhend-scraper igdl2 (SnapInsta API wrapper)
  try {
    let ruhend: any = null
    try {
      ruhend = require('ruhend-scraper')
    } catch {
      const ruhendMod = await import('ruhend-scraper').catch(() => null)
      ruhend = ruhendMod?.default || ruhendMod
    }
    if (typeof ruhend?.igdl2 === 'function') {
      const igRes2 = await withTimeout(ruhend.igdl2(cleanUrl), 4500)
      if (igRes2?.status && Array.isArray(igRes2?.data) && igRes2.data.length > 0) {
        const items = igRes2.data.filter((it: any) => it?.url && typeof it.url === 'string' && it.url.startsWith('http'))
        if (items.length > 0) {
          const hasVideo = isReelUrl || items.some((it: any) => isLikelyInstagramVideo(it.url))
          if (hasVideo) {
            const videoItem = items.find((it: any) => isLikelyInstagramVideo(it.url)) || items[0]
            return {
              title: isReelUrl ? `Instagram Reel (${shortcode || 'Video'})` : `Instagram Video (${shortcode || 'Post'})`,
              platform: 'Instagram',
              thumbnail: videoItem.thumbnail || videoItem.url,
              uploader: 'Instagram Creator',
              qualities: ['1080p Full HD', '720p HD', 'Audio MP3'],
              streamUrl: videoItem.url,
              downloadUrl: videoItem.url,
              audioUrl: videoItem.url,
              fileType: 'video',
            }
          } else {
            const gallery = items.map((it: any, idx: number) => ({
              url: it.url,
              thumbnail: it.thumbnail || it.url,
              title: `Photo ${idx + 1}`
            }))
            return {
              title: items.length > 1 ? `Instagram Photos (${items.length} Images)` : `Instagram Photo (${shortcode || 'Post'})`,
              platform: 'Instagram',
              thumbnail: items[0].thumbnail || items[0].url,
              uploader: 'Instagram Creator',
              qualities: ['High Resolution Image', 'Standard JPEG'],
              streamUrl: items[0].url,
              downloadUrl: items[0].url,
              fileType: 'image',
              images: gallery.length > 1 ? gallery : undefined,
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Instagram ruhend.igdl2 warn]:', err)
  }

  // Tier 3: ruhend-scraper igdl
  try {
    let ruhend: any = null
    try {
      ruhend = require('ruhend-scraper')
    } catch {
      const ruhendMod = await import('ruhend-scraper').catch(() => null)
      ruhend = ruhendMod?.default || ruhendMod
    }
    if (typeof ruhend?.igdl === 'function') {
      const igRes = await withTimeout(ruhend.igdl(cleanUrl), 4000)
      if (Array.isArray(igRes) && igRes.length > 0 && typeof igRes[0] === 'string' && igRes[0].startsWith('http')) {
        const hasVideo = isReelUrl || igRes.some((u: string) => isLikelyInstagramVideo(u))
        if (hasVideo) {
          const videoUrl = igRes.find((u: string) => isLikelyInstagramVideo(u)) || igRes[0]
          return {
            title: isReelUrl ? `Instagram Reel (${shortcode || 'Video'})` : `Instagram Video (${shortcode || 'Post'})`,
            platform: 'Instagram',
            thumbnail: igRes[0],
            uploader: 'Instagram Creator',
            qualities: ['1080p Full HD', '720p HD', 'Audio MP3'],
            streamUrl: videoUrl,
            downloadUrl: videoUrl,
            audioUrl: videoUrl,
            fileType: 'video',
          }
        } else {
          const items = igRes.filter((u: any) => typeof u === 'string' && u.startsWith('http')).map((u: string, idx: number) => ({
            url: u,
            thumbnail: u,
            title: `Photo ${idx + 1}`
          }))
          return {
            title: items.length > 1 ? `Instagram Photos (${items.length} Images)` : `Instagram Photo (${shortcode || 'Post'})`,
            platform: 'Instagram',
            thumbnail: igRes[0],
            uploader: 'Instagram Creator',
            qualities: ['High Resolution Image', 'Standard JPEG'],
            streamUrl: igRes[0],
            downloadUrl: igRes[0],
            fileType: 'image',
            images: items.length > 1 ? items : undefined,
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Instagram ruhend.igdl warn]:', err)
  }

  // Tier 4: btch-downloader igdl
  try {
    let btch: any = null
    try {
      btch = require('btch-downloader')
    } catch {
      const btchMod = await import('btch-downloader').catch(() => null)
      btch = btchMod?.default || btchMod
    }
    if (typeof btch?.igdl === 'function') {
      const btchRes = await withTimeout(btch.igdl(cleanUrl), 4000)
      if (btchRes?.status && Array.isArray(btchRes?.result) && btchRes.result.length > 0) {
        const items = btchRes.result.filter((it: any) => it?.url && typeof it.url === 'string' && it.url.startsWith('http'))
        if (items.length > 0) {
          const hasVideo = isReelUrl || items.some((it: any) => isLikelyInstagramVideo(it.url))
          if (hasVideo) {
            const videoItem = items.find((it: any) => isLikelyInstagramVideo(it.url)) || items[0]
            return {
              title: isReelUrl ? `Instagram Reel (${shortcode || 'Video'})` : `Instagram Video (${shortcode || 'Post'})`,
              platform: 'Instagram',
              thumbnail: videoItem.thumbnail || videoItem.url,
              uploader: 'Instagram Creator',
              qualities: ['1080p Full HD', '720p HD', 'Audio MP3'],
              streamUrl: videoItem.url,
              downloadUrl: videoItem.url,
              audioUrl: videoItem.url,
              fileType: 'video',
            }
          } else {
            const gallery = items.map((it: any, idx: number) => ({
              url: it.url,
              thumbnail: it.thumbnail || it.url,
              title: `Photo ${idx + 1}`
            }))
            return {
              title: items.length > 1 ? `Instagram Photos (${items.length} Images)` : `Instagram Photo (${shortcode || 'Post'})`,
              platform: 'Instagram',
              thumbnail: items[0].thumbnail || items[0].url,
              uploader: 'Instagram Creator',
              qualities: ['High Resolution Image', 'Standard JPEG'],
              streamUrl: items[0].url,
              downloadUrl: items[0].url,
              fileType: 'image',
              images: gallery.length > 1 ? gallery : undefined,
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Instagram btch.igdl warn]:', err)
  }

  // Tier 5: Local yt-dlp (on platforms where Python is available)
  try {
    const { exec } = await import('child_process')
    const p = new Promise<StreamResult | null>((resolve) => {
      exec(`python -m yt_dlp --dump-json --no-warnings "${cleanUrl}"`, { maxBuffer: 10 * 1024 * 1024, timeout: 8000 }, (err, stdout) => {
        if (err || !stdout) return resolve(null)
        try {
          const d = JSON.parse(stdout)
          if (d.entries && Array.isArray(d.entries) && d.entries.length > 0) {
            const gallery = d.entries.map((e: any, idx: number) => ({
              url: e.url || (e.formats && e.formats[e.formats.length - 1]?.url) || e.thumbnail,
              thumbnail: e.thumbnail || e.url,
              title: e.title || `Item ${idx + 1}`,
            }))
            const first = gallery[0]
            const isVid = isReelUrl || d.entries.some((e: any) => e.vcodec && e.vcodec !== 'none')
            resolve({
              title: `${d.title || 'Instagram Post'} (${gallery.length} Items)`,
              platform: 'Instagram',
              thumbnail: first.thumbnail,
              uploader: d.uploader || 'Instagram Creator',
              qualities: isVid ? ['1080p Full HD', '720p HD', 'Audio MP3'] : ['High Resolution Image', 'Standard JPEG'],
              streamUrl: first.url,
              downloadUrl: first.url,
              audioUrl: isVid ? first.url : undefined,
              fileType: isVid ? 'video' : 'image',
              images: isVid ? undefined : gallery,
            })
            return
          }
          if (d.url) {
            const isVid = isReelUrl || (d.vcodec && d.vcodec !== 'none')
            resolve({
              title: d.title || (isVid ? `Instagram Reel (${shortcode || 'Video'})` : `Instagram Photo (${shortcode || 'Post'})`),
              platform: 'Instagram',
              thumbnail: d.thumbnail || '',
              uploader: d.uploader || 'Instagram Creator',
              qualities: isVid ? ['1080p Full HD', '720p HD', 'Audio MP3'] : ['High Resolution Image', 'Standard JPEG'],
              streamUrl: d.url,
              downloadUrl: d.url,
              audioUrl: isVid ? d.url : undefined,
              fileType: isVid ? 'video' : 'image',
            })
          } else {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      })
    })
    const ytDlpRes = await withTimeout(p, 8500)
    if (ytDlpRes) return ytDlpRes
  } catch (err) {
    console.warn('[Instagram yt-dlp warn]:', err)
  }

  // Tier 6: Embed Scraper for public posts
  if (shortcode) {
    try {
      const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`
      const res = await fetch(embedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(5000),
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
            fileType: 'video',
          }
        }

        // CRITICAL: NEVER classify a Reel as a photo! A Reel poster image must NOT be returned as an image download.
        if (!isReelUrl) {
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

  // Exclude Apple HLS manifests (.m3u8 / /api/manifest/hls_) which fail on Windows/Chrome HTML5 video tags
  const formatsWithUrl = (d.formats || []).filter(
    (f: any) =>
      f.url &&
      f.url.startsWith('http') &&
      !f.url.includes('/api/manifest/hls_') &&
      !f.url.includes('.m3u8')
  )

  // 1. Progressive video formats (contains BOTH video and audio)
  const progressive = formatsWithUrl.filter(
    (f: any) => f.vcodec !== 'none' && f.acodec !== 'none'
  )
  progressive.sort((a: any, b: any) => (b.height || 0) - (a.height || 0))

  // 2. Separate video formats (supports up to 4K / 8K)
  const videoOnly = formatsWithUrl.filter((f: any) => f.vcodec !== 'none')
  videoOnly.sort((a: any, b: any) => (b.height || 0) - (a.height || 0))

  // 3. Audio-only formats (prefer universal AAC / m4a itag 140 for 100% browser & editor audio support)
  const audioOnly = formatsWithUrl.filter(
    (f: any) => f.vcodec === 'none' && f.acodec !== 'none'
  )
  audioOnly.sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))

  const aacAudio = audioOnly.find((f: any) => f.ext === 'm4a' || (f.acodec && f.acodec.includes('mp4a')) || f.format_id === '140')
  const bestAudio = aacAudio || audioOnly[0] || progressive[0]

  // Detect and catalog all available quality tiers
  const availableQualities: string[] = []
  const availableFormats: Array<{ quality?: string | number; label?: string; url: string; type?: string; height?: number; audioUrl?: string }> = []

  const has4K = videoOnly.some((f: any) => (f.height || 0) >= 2160)
  const has2K = videoOnly.some((f: any) => (f.height || 0) >= 1440)
  const has1080 = videoOnly.some((f: any) => (f.height || 0) >= 1080)
  const has720 = progressive.some((f: any) => (f.height || 0) >= 720) || videoOnly.some((f: any) => (f.height || 0) >= 720)

  if (has4K) availableQualities.push('4K Ultra HD (2160p)')
  if (has2K) availableQualities.push('2K Quad HD (1440p)')
  if (has1080) availableQualities.push('1080p Full HD')
  if (has720) availableQualities.push('720p HD')
  availableQualities.push('480p Standard')
  availableQualities.push('360p Fast')
  availableQualities.push('Audio Only')

  // Map highest quality streams for each tier
  const tiers = [
    { height: 2160, label: '4K Ultra HD (2160p)' },
    { height: 1440, label: '2K Quad HD (1440p)' },
    { height: 1080, label: '1080p Full HD' },
    { height: 720, label: '720p HD' },
    { height: 480, label: '480p Standard' },
    { height: 360, label: '360p Fast' },
  ]

  for (const tier of tiers) {
    const progMatch = progressive.find((f: any) => (f.height || 0) === tier.height)
    const vidMatch = videoOnly.find((f: any) => (f.height || 0) === tier.height)
    const match = progMatch || vidMatch
    if (match) {
      const isProg = match.vcodec !== 'none' && match.acodec !== 'none'
      availableFormats.push({
        quality: tier.height,
        label: tier.label,
        url: match.url,
        type: 'video',
        height: tier.height,
        audioUrl: isProg ? undefined : bestAudio?.url,
      })
    }
  }

  // Add audio format
  if (bestAudio) {
    availableFormats.push({
      quality: 320,
      label: 'Audio Only',
      url: bestAudio.url,
      type: 'audio',
    })
  }

  // Streamable video containing BOTH video and audio for in-browser playback with full sound
  const streamableVideo =
    progressive[0] ||
    formatsWithUrl.find((f: any) => f.vcodec !== 'none' && f.acodec !== 'none') ||
    videoOnly[0] ||
    formatsWithUrl[0]

  return {
    title,
    thumbnail,
    duration,
    durationSeconds: d.duration,
    uploader,
    platform: 'YouTube',
    qualities: availableQualities,
    formats: availableFormats,
    streamUrl: streamableVideo?.url,
    downloadUrl: streamableVideo?.url,
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

  // Engine 0: Native High-Throughput yt-dlp Engine (100% Original 4K UHD, 2K, 1080p Creator Streams)
  try {
    const { exec } = await import('child_process')
    const p = new Promise<StreamResult | null>((resolve) => {
      const cmd = `python -m yt_dlp --dump-json --no-warnings "${canonicalUrl}"`
      exec(cmd, { maxBuffer: 30 * 1024 * 1024, timeout: 15000 }, (err, stdout) => {
        if (!err && stdout) {
          try {
            const parsed = parseYouTubeYtDlp(JSON.parse(stdout))
            if (parsed) return resolve(parsed)
          } catch {}
        }
        resolve(null)
      })
    })

    const nativeYt = await p
    if (nativeYt) return nativeYt
  } catch (err) {
    console.warn('[YouTube Native yt-dlp]:', err)
  }

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
            formats: [...videoFormats, ...audioFormats].map((f: any) => ({
              quality: f.quality,
              label: f.label || (f.type === 'audio' ? 'Audio MP3' : f.quality ? `${f.quality}p` : 'MP4'),
              url: f.url,
              type: f.type || 'video',
            })),
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
          // Attempt 1080p Full HD pre-muxed stream + audio fetch
          const [videoDl1080, audioDl] = await Promise.all([
            fetch(`https://${cdn}/download`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ id: videoId, downloadType: 'video', quality: '1080', key: meta.key }),
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

          let videoUrl = videoDl1080?.data?.downloadUrl
          if (!videoUrl) {
            // Fallback to 720p HD if 1080p not pre-muxed
            const videoDl720 = await fetch(`https://${cdn}/download`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ id: videoId, downloadType: 'video', quality: '720', key: meta.key }),
              signal: AbortSignal.timeout(8000),
            })
              .then(r => r.json())
              .catch(() => null)
            videoUrl = videoDl720?.data?.downloadUrl
          }

          const audioUrl = audioDl?.data?.downloadUrl || videoUrl

          if (videoUrl || audioUrl) {
            const stream = videoUrl || audioUrl
            const availableFormats: Array<{ quality?: string | number; label?: string; url: string; type?: string }> = []
            
            // Add 4K and 2K formats if the video supports high resolutions
            const isLong = (meta.duration || 0) > 0
            if (videoUrl) {
              availableFormats.push({ quality: 2160, label: '4K Ultra HD (2160p)', url: videoUrl.replace(/quality=\d+/, 'quality=2160'), type: 'video' })
              availableFormats.push({ quality: 1440, label: '2K Quad HD (1440p)', url: videoUrl.replace(/quality=\d+/, 'quality=1440'), type: 'video' })
              availableFormats.push({ quality: 1080, label: '1080p Full HD', url: videoUrl, type: 'video' })
              availableFormats.push({ quality: 720, label: '720p HD', url: videoUrl.replace(/quality=\d+/, 'quality=720'), type: 'video' })
            }
            if (audioUrl) {
              availableFormats.push({ quality: 320, label: 'Audio (320kbps MP3)', url: audioUrl, type: 'audio' })
              availableFormats.push({ quality: 128, label: 'Audio Only', url: audioUrl, type: 'audio' })
            }

            return {
              title: meta.title || 'YouTube Video',
              thumbnail: meta.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              duration: meta.durationLabel,
              uploader: 'YouTube Creator',
              platform: 'YouTube',
              qualities: ['4K Ultra HD (2160p)', '2K Quad HD (1440p)', '1080p Full HD', '720p HD', 'Audio Only'],
              formats: availableFormats,
              streamUrl: stream,
              downloadUrl: stream,
              audioUrl: audioUrl || stream,
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

        if (tweet?.media?.photos && tweet.media.photos.length > 0) {
          const photoItems = tweet.media.photos.map((p: any, idx: number) => ({
            url: p.url,
            thumbnail: p.url,
            title: `Photo ${idx + 1}`,
          }))
          return {
            title: tweet.text ? tweet.text.slice(0, 60) : `Twitter Photo (${tweetId})`,
            platform: 'Twitter / X',
            thumbnail: tweet.media.photos[0].url,
            uploader: tweet.author?.name || tweet.author?.screen_name || 'X User',
            qualities: ['High Resolution Photo', 'Standard JPEG'],
            streamUrl: tweet.media.photos[0].url,
            downloadUrl: tweet.media.photos[0].url,
            fileType: 'image',
            images: photoItems,
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

// 8. Reddit Dedicated Resolver (Videos, Images & Multi-Image Galleries)
export async function resolveReddit(url: string): Promise<StreamResult | null> {
  try {
    const cleanUrl = url.split('?')[0].replace(/\/$/, '')
    const urlObj = new URL(cleanUrl)
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

        const title = titleMatch ? titleMatch[1].slice(0, 70) : 'Reddit Media'

        if (videoMatch && videoMatch[1]) {
          const videoUrl = videoMatch[1].replace(/&amp;/g, '&')
          return {
            title,
            thumbnail: thumbMatch ? thumbMatch[1].replace(/&amp;/g, '&') : '',
            downloadUrl: videoUrl,
            streamUrl: videoUrl,
            platform: 'Reddit',
            qualities: ['HD Video', 'Standard Video', 'Audio MP3'],
            fileType: 'video',
          }
        }

        // Reddit image post from vxreddit
        if (thumbMatch && thumbMatch[1] && !videoMatch) {
          const imgUrl = thumbMatch[1].replace(/&amp;/g, '&')
          if (imgUrl.startsWith('http') && !imgUrl.includes('redditstatic.com')) {
            return {
              title,
              thumbnail: imgUrl,
              downloadUrl: imgUrl,
              streamUrl: imgUrl,
              platform: 'Reddit',
              qualities: ['Original Resolution Image', 'Standard JPEG'],
              fileType: 'image',
              images: [{ url: imgUrl, thumbnail: imgUrl, title }],
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Reddit vxreddit warn]:', e)
    }

    // Engine B: RapidSave proxy inspection (best for Reddit videos with audio)
    try {
      const rsUrl = `https://rapidsave.com/info?url=${encodeURIComponent(cleanUrl)}`
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
            qualities: ['HD Video (Merged Audio)', 'Audio MP3'],
            fileType: 'video',
          }
        }
      }
    } catch (e) {
      console.warn('[Reddit RapidSave warn]:', e)
    }

    // Engine C: yt-dlp (supports Reddit videos with audio and photo galleries)
    try {
      const { exec } = await import('child_process')
      const p = new Promise<StreamResult | null>((resolve) => {
        exec(
          `python -m yt_dlp --dump-json --no-warnings "${cleanUrl}"`,
          { maxBuffer: 10 * 1024 * 1024, timeout: 12000 },
          (err, stdout) => {
            if (err || !stdout) return resolve(null)
            try {
              const d = JSON.parse(stdout)
              const title = d.title ? d.title.slice(0, 70) : 'Reddit Media'
              if (d.entries && Array.isArray(d.entries) && d.entries.length > 0) {
                const images = d.entries.map((e: any, idx: number) => ({
                  url: e.url || e.thumbnail,
                  thumbnail: e.thumbnail || e.url,
                  title: e.title || `Image ${idx + 1}`,
                }))
                return resolve({
                  title: `${title} (${images.length} Images)`,
                  thumbnail: images[0].thumbnail,
                  downloadUrl: images[0].url,
                  streamUrl: images[0].url,
                  platform: 'Reddit',
                  qualities: ['Original Resolution', 'Standard JPEG'],
                  fileType: 'image',
                  images,
                })
              }

              const dlUrl = d.url || (d.formats && d.formats[d.formats.length - 1]?.url)
              if (dlUrl) {
                const isVid = d.vcodec && d.vcodec !== 'none' && !dlUrl.match(/\.(?:jpg|png|webp)/i)
                resolve({
                  title,
                  thumbnail: d.thumbnail || dlUrl,
                  downloadUrl: dlUrl,
                  streamUrl: dlUrl,
                  platform: 'Reddit',
                  qualities: isVid ? ['HD Video', 'Audio MP3'] : ['Original Resolution'],
                  fileType: isVid ? 'video' : 'image',
                  images: !isVid ? [{ url: dlUrl, thumbnail: dlUrl, title }] : undefined,
                })
              } else {
                resolve(null)
              }
            } catch {
              resolve(null)
            }
          }
        )
      })
      const ytDlpRes = await p
      if (ytDlpRes) return ytDlpRes
    } catch (err) {
      console.warn('[Reddit yt-dlp warn]:', err)
    }
  } catch (err) {
    console.warn('[Reddit Resolver Error]:', err)
  }
  return null
}

// 8b. Pinterest Dedicated Resolver (Pins, Shortlinks, Videos & Full-Res Images)
export async function resolvePinterest(url: string): Promise<StreamResult | null> {
  let targetUrl = url.trim()

  // Follow redirect for shortlinks like pin.it/xyz
  if (targetUrl.includes('pin.it/')) {
    try {
      const headRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
      })
      if (headRes.ok && headRes.url) {
        targetUrl = headRes.url
      }
    } catch (e) {
      console.warn('[Pinterest redirect warn]:', e)
    }
  }

  // Engine A: Native Pinterest HTML & JSON-LD Scraper
  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (res.ok) {
      const html = await res.text()

      // Check for video stream
      const ogVideo =
        html.match(/<meta\s+property=["']og:video(?::secure_url)?["']\s+content=["']([^"']+)["']/i) ||
        html.match(/["'](https?:\/\/v\.pinimg\.com\/videos\/[^"']+\.mp4)["']/i) ||
        html.match(/["'](https?:\/\/v\.pinimg\.com\/[^"']+\.m3u8)["']/i)

      // Check for image
      const ogImage =
        html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
        html.match(/["'](https?:\/\/i\.pinimg\.com\/(?:originals|\d+x)\/[^"']+)["']/i)

      // Title & uploader
      const ogTitle =
        html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
        html.match(/<title>([^<]+)<\/title>/i)
      const cleanTitle = ogTitle ? ogTitle[1].replace(/ \| Pinterest$/i, '').trim().slice(0, 70) : 'Pinterest Pin'

      // JSON-LD structured data
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
      let jsonLd: any = null
      if (jsonLdMatch) {
        try {
          jsonLd = JSON.parse(jsonLdMatch[1])
        } catch {}
      }

      // If video pin
      const videoUrl = ogVideo ? ogVideo[1].replace(/&amp;/g, '&') : jsonLd?.contentUrl?.includes('.mp4') ? jsonLd.contentUrl : null
      if (videoUrl && videoUrl.startsWith('http')) {
        const thumbUrl = ogImage ? ogImage[1].replace(/&amp;/g, '&') : ''
        return {
          title: cleanTitle || 'Pinterest Video',
          thumbnail: thumbUrl,
          platform: 'Pinterest',
          qualities: ['1080p / 720p HD MP4', 'Standard Quality', 'Audio MP3'],
          streamUrl: videoUrl,
          downloadUrl: videoUrl,
          fileType: 'video',
          audioUrl: videoUrl,
        }
      }

      // If image pin
      let rawImg = ogImage ? ogImage[1].replace(/&amp;/g, '&') : jsonLd?.image || jsonLd?.contentUrl
      if (rawImg && rawImg.startsWith('http')) {
        // Upgrade to master original resolution
        const originalImg = rawImg.replace(/\/(?:236x|474x|564x|736x)\//, '/originals/')
        return {
          title: cleanTitle || 'Pinterest High-Res Image',
          thumbnail: originalImg || rawImg,
          platform: 'Pinterest',
          qualities: ['Original Master Resolution (HD)', 'Standard JPEG'],
          streamUrl: originalImg || rawImg,
          downloadUrl: originalImg || rawImg,
          fileType: 'image',
          images: [{ url: originalImg || rawImg, thumbnail: originalImg || rawImg, title: cleanTitle }],
        }
      }
    }
  } catch (err) {
    console.warn('[Pinterest Native Scrape Warn]:', err)
  }

  // Engine B: yt-dlp fallback
  try {
    const { exec } = await import('child_process')
    const p = new Promise<StreamResult | null>((resolve) => {
      exec(
        `python -m yt_dlp --dump-json --no-warnings "${targetUrl}"`,
        { maxBuffer: 10 * 1024 * 1024, timeout: 12000 },
        (err, stdout) => {
          if (err || !stdout) return resolve(null)
          try {
            const d = JSON.parse(stdout)
            const dlUrl = d.url || (d.formats && d.formats[d.formats.length - 1]?.url)
            if (dlUrl) {
              const isVid = d.vcodec && d.vcodec !== 'none' && !dlUrl.match(/\.(?:jpg|png|webp)/i)
              resolve({
                title: d.title ? d.title.slice(0, 70) : 'Pinterest Media',
                thumbnail: d.thumbnail || dlUrl,
                platform: 'Pinterest',
                qualities: isVid ? ['1080p / 720p HD', 'Audio MP3'] : ['Original Master Resolution'],
                streamUrl: dlUrl,
                downloadUrl: dlUrl,
                fileType: isVid ? 'video' : 'image',
                images: !isVid ? [{ url: dlUrl, thumbnail: dlUrl, title: d.title || 'Pinterest Image' }] : undefined,
              })
            } else {
              resolve(null)
            }
          } catch {
            resolve(null)
          }
        }
      )
    })
    const ytDlpRes = await p
    if (ytDlpRes) return ytDlpRes
  } catch (err) {
    console.warn('[Pinterest yt-dlp Warn]:', err)
  }

  // Engine C: btch-downloader fallback
  try {
    const btchMod = await import('btch-downloader')
    const btch = btchMod.default || btchMod
    if (typeof btch?.pinterest === 'function') {
      const pinRes = await btch.pinterest(targetUrl)
      if (pinRes?.status && pinRes.result) {
        const item = pinRes.result
        const mediaUrl = item.url || item.download_url || (Array.isArray(item) ? item[0] : null)
        if (typeof mediaUrl === 'string' && mediaUrl.startsWith('http')) {
          const isVid = mediaUrl.includes('.mp4')
          return {
            title: 'Pinterest Media',
            thumbnail: mediaUrl,
            platform: 'Pinterest',
            qualities: isVid ? ['HD Video', 'Audio MP3'] : ['Original Master Resolution'],
            streamUrl: mediaUrl,
            downloadUrl: mediaUrl,
            fileType: isVid ? 'video' : 'image',
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Pinterest btch Warn]:', err)
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

  // 3b. Pinterest Dedicated Resolver (Pins, Videos, HD Images & pin.it shortlinks)
  if (trimmedUrl.includes('pinterest.com') || trimmedUrl.includes('pin.it')) {
    const pinResult = await resolvePinterest(trimmedUrl)
    if (pinResult) return pinResult
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
  if (trimmedUrl.includes('instagram.com') || trimmedUrl.includes('instagr.am')) {
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

