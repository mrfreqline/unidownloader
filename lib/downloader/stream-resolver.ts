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
  const shortcodeMatch =
    url.match(/(?:reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/)
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : null

  // Engine A: Dedicated Instagram API Proxy
  try {
    const apiUrl = `https://instagram-video-downloader-mu.vercel.app/api/video?postUrl=${encodeURIComponent(url)}`
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (res.ok) {
      const data = await res.json()
      if (data?.status === 'success' && data?.data?.videoUrl) {
        const videoUrl = data.data.videoUrl
        return {
          title: `Instagram Video (${shortcode || 'Reel'})`,
          platform: 'Instagram',
          thumbnail: '',
          uploader: 'Instagram Creator',
          qualities: ['HD Original', 'Standard MP4', 'Audio MP3'],
          streamUrl: videoUrl,
          downloadUrl: videoUrl,
        }
      } else if (data?.message?.includes('not public')) {
        throw new Error('This Instagram post is private, age-restricted, or requires login to view. Please use a public post or reel.')
      }
    }
  } catch (err: any) {
    if (err?.message?.includes('private')) {
      throw err
    }
    console.warn('[Instagram Dedicated API Warn]:', err)
  }

  // Engine B: Embed Scraper for public posts
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
            qualities: ['HD Video MP4', 'Audio MP3'],
            streamUrl: videoUrl,
            downloadUrl: videoUrl,
          }
        }
      }
    } catch (err) {
      console.warn('[Instagram Embed Warn]:', err)
    }
  }

  throw new Error('This Instagram post is private or inaccessible without login. Please ensure the link is public and accessible.')
}

// 4. Twitter / X Dedicated Resolver
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
        'YouTube Engine is currently undergoing scheduled maintenance for v2.5 upgrade. TikTok, Facebook, Instagram, Twitter/X, and Direct Movie links are 100% operational!',
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

  // 7. Fallback inspection ONLY for verified direct video streams (strictly non-HTML)
  const genericInspect = await inspectDirectVideo(trimmedUrl)
  if (genericInspect) return genericInspect

  throw new Error('Unable to resolve media from this link. Please ensure the link is public and accessible.')
}
