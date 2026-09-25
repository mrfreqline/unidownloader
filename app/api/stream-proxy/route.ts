import { NextRequest, NextResponse } from 'next/server'
import { resolveMediaUrl } from '@/lib/downloader/stream-resolver'

// In-memory URL resolution cache to prevent duplicate yt-dlp executions for byte-range requests
const proxyUrlCache = new Map<string, { url: string; time: number }>()

// High-Throughput Direct Media Stream Proxy with Range request support & CORS headers
// Enables cross-origin HTML5 canvas ingest and Safari/iOS playback with full sound
export async function GET(req: NextRequest) {
  let targetUrl = ''
  let cacheKey = ''
  let isWeb = false

  try {
    const { searchParams } = new URL(req.url)
    const rawTarget = searchParams.get('url')

    if (!rawTarget) {
      return NextResponse.json({ error: 'No url provided' }, { status: 400 })
    }

    targetUrl = rawTarget
    const targetQ = searchParams.get('quality') || '720'

    // If user passed a web page URL (YouTube, TikTok, etc.) instead of direct CDN video stream, resolve it!
    isWeb = /youtube\.com|youtu\.be|tiktok\.com|instagram\.com|twitter\.com|x\.com|facebook\.com/i.test(targetUrl)
    if (isWeb) {
      cacheKey = `${targetUrl}_${targetQ}`
      const cached = proxyUrlCache.get(cacheKey)
      if (cached && Date.now() - cached.time < 30 * 60 * 1000) {
        targetUrl = cached.url
      } else {
        try {
          const resolved = await resolveMediaUrl(targetUrl)
          if (targetQ === 'audio') {
            targetUrl =
              resolved.audioUrl ||
              resolved.formats?.find(f => f.type === 'audio')?.url ||
              resolved.streamUrl ||
              rawTarget
          } else if (targetQ === 'stream' || targetQ === 'auto') {
            // Preview streaming mode: always use progressive stream containing both video & audio
            targetUrl = resolved.streamUrl || resolved.downloadUrl || rawTarget
          } else {
            const cleanQ = targetQ.toLowerCase().replace(/[^\d]/g, '')
            const matched = resolved.formats?.find(f => {
              if (!f.url || f.type === 'audio') return false
              const qStr = `${f.quality || ''} ${f.label || ''}`.toLowerCase()
              return (cleanQ && qStr.includes(cleanQ)) || (targetQ && qStr.includes(targetQ.toLowerCase()))
            })
            targetUrl = matched?.url || resolved.streamUrl || resolved.downloadUrl || rawTarget
          }
          proxyUrlCache.set(cacheKey, { url: targetUrl, time: Date.now() })
        } catch (err) {
          console.warn('[Proxy resolution warn]:', err)
        }
      }
    }

    const rangeHeader = req.headers.get('range')
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    }

    if (rangeHeader) {
      headers['Range'] = rangeHeader
    }

    // Set origin/referer for known restricted CDNs
    if (targetUrl.includes('savetube') || targetUrl.includes('yt.savetube')) {
      headers['Referer'] = 'https://yt.savetube.me/'
    } else if (targetUrl.includes('tikwm')) {
      headers['Referer'] = 'https://www.tikwm.com/'
    } else if (targetUrl.includes('fbcdn') || targetUrl.includes('instagram')) {
      headers['Referer'] = 'https://www.instagram.com/'
    }

    let upstreamRes = await fetch(targetUrl, {
      headers,
      signal: AbortSignal.timeout(600000),
    })

    // If upstream returns 403 or error and was a web URL, invalidate cache and re-resolve once
    if (!upstreamRes.ok && upstreamRes.status !== 206 && isWeb) {
      if (cacheKey) proxyUrlCache.delete(cacheKey)
      try {
        const freshResolved = await resolveMediaUrl(rawTarget)
        if (targetQ === 'audio') {
          targetUrl = freshResolved.audioUrl || freshResolved.formats?.find(f => f.type === 'audio')?.url || rawTarget
        } else {
          targetUrl = freshResolved.streamUrl || freshResolved.downloadUrl || rawTarget
        }
        if (cacheKey) proxyUrlCache.set(cacheKey, { url: targetUrl, time: Date.now() })
        upstreamRes = await fetch(targetUrl, {
          headers,
          signal: AbortSignal.timeout(600000),
        })
      } catch (retryErr) {
        console.warn('[Proxy retry resolution warn]:', retryErr)
      }
    }

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return NextResponse.json(
        { error: `Upstream media server responded with status ${upstreamRes.status}` },
        {
          status: upstreamRes.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const responseHeaders = new Headers()
    const contentType =
      upstreamRes.headers.get('content-type') || (targetQ === 'audio' ? 'audio/mp4' : 'video/mp4')
    responseHeaders.set('Content-Type', contentType)

    // Crucial for Canvas crossOrigin drawImage & Web Audio processing without taint
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type')
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges')
    responseHeaders.set('Accept-Ranges', 'bytes')

    const contentLength = upstreamRes.headers.get('content-length')
    if (contentLength) responseHeaders.set('Content-Length', contentLength)

    const contentRange = upstreamRes.headers.get('content-range')
    if (contentRange) responseHeaders.set('Content-Range', contentRange)

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    })
  } catch (err: any) {
    console.warn('[Proxy stream error]:', err?.message || err)
    return NextResponse.json(
      { error: err?.message || 'Proxy error' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    },
  })
}
