import { NextRequest, NextResponse } from 'next/server'
import { resolveMediaUrl } from '@/lib/downloader/stream-resolver'
import { processMediaEnhancement } from '@/lib/downloader/enhancer'
import dns from 'dns'
import fs from 'fs'

try {
  dns.setDefaultResultOrder('ipv4first')
} catch {}

interface DownloadParams {
  url?: string
  quality?: string
  mediaType?: 'video' | 'audio' | 'image'
  downloadUrl?: string
  title?: string
  enhancement?: any
  isGetRequest?: boolean
}

async function handleDownload(params: DownloadParams) {
  try {
    const { url, quality, mediaType, downloadUrl: providedDownloadUrl, title = 'media', enhancement, isGetRequest } = params

    if (!url && !providedDownloadUrl) {
      return NextResponse.json({ error: 'No media URL provided' }, { status: 400 })
    }

    let targetDownloadUrl = providedDownloadUrl
    const isAudio = mediaType === 'audio' || quality === 'Audio Only' || quality === 'mp3'

    const isWebpageUrl = (testUrl?: string): boolean => {
      if (!testUrl || !testUrl.startsWith('http')) return false
      try {
        const parsed = new URL(testUrl)
        const host = parsed.hostname.toLowerCase()
        if (
          host.includes('youtube.com') ||
          host.includes('youtu.be') ||
          host.includes('tiktok.com') ||
          host.includes('instagram.com') ||
          host.includes('twitter.com') ||
          host.includes('x.com') ||
          host.includes('facebook.com') ||
          host.includes('fb.watch') ||
          host.includes('reddit.com') ||
          host.includes('pinterest.com') ||
          host.includes('pin.it')
        ) {
          return true
        }
        return false
      } catch {
        return false
      }
    }

    let resolvedAudioUrl: string | undefined

    // If targetDownloadUrl was not provided, equals the source web URL, or is a webpage URL, resolve the direct media stream
    if (!targetDownloadUrl || targetDownloadUrl === url || isWebpageUrl(targetDownloadUrl)) {
      if (url) {
        try {
          const resolved = await resolveMediaUrl(url)
          const requestedQuality = enhancement?.targetQuality || quality
          resolvedAudioUrl = resolved.audioUrl
          
          if (isAudio) {
            targetDownloadUrl = resolved.audioUrl || resolved.downloadUrl || resolved.streamUrl
          } else if (requestedQuality && resolved.formats && Array.isArray(resolved.formats) && resolved.formats.length > 0) {
            // Find format matching requested quality label or number (e.g., '2160', '1080', '720', '4K')
            const cleanQ = requestedQuality.toString().toLowerCase().replace(/[^\d]/g, '')
            const matched = resolved.formats.find(f => {
              if (!f.url) return false
              const qStr = `${f.quality || ''} ${f.label || ''}`.toLowerCase()
              const reqStr = requestedQuality.toString().toLowerCase()
              return qStr.includes(reqStr) || (cleanQ && qStr.includes(cleanQ))
            })
            targetDownloadUrl = matched?.url || resolved.downloadUrl || resolved.streamUrl
            if (matched?.audioUrl) {
              resolvedAudioUrl = matched.audioUrl
            }
          } else {
            targetDownloadUrl = resolved.downloadUrl || resolved.streamUrl
          }
        } catch (resErr: any) {
          console.warn('[Download Route Stream Resolution Error]:', resErr?.message || resErr)
        }
      }
    }

    if (!targetDownloadUrl || isWebpageUrl(targetDownloadUrl)) {
      return NextResponse.json(
        { error: 'Could not extract direct stream. Please try another link.' },
        { status: 400 }
      )
    }

    // Only invoke heavy serverless FFmpeg when explicit trimming/clip enhancement is requested
    const isExplicitTrim = Boolean(enhancement && enhancement.enabled && enhancement.trimEnabled)

    if (isExplicitTrim) {
      try {
        const enhanced = await processMediaEnhancement(
          targetDownloadUrl,
          isAudio ? 'audio' : (mediaType || 'video'),
          enhancement,
          title,
          resolvedAudioUrl
        )

        const stat = fs.statSync(enhanced.filePath)
        const nodeStream = fs.createReadStream(enhanced.filePath)
        
        // Zero-memory web stream from disk directly to user browser
        const webStream = new ReadableStream({
          start(controller) {
            nodeStream.on('data', (chunk) => controller.enqueue(chunk))
            nodeStream.on('end', () => {
              controller.close()
              enhanced.cleanup()
            })
            nodeStream.on('error', (err) => {
              controller.error(err)
              enhanced.cleanup()
            })
          },
          cancel() {
            nodeStream.destroy()
            enhanced.cleanup()
          },
        })

        const responseHeaders = new Headers()
        responseHeaders.set('Content-Type', enhanced.contentType)
        responseHeaders.set('Content-Disposition', `attachment; filename="${enhanced.fileName}"`)
        responseHeaders.set('Content-Length', stat.size.toString())

        return new NextResponse(webStream, {
          headers: responseHeaders,
        })
      } catch (enhErr: any) {
        console.error('[Enhancement Processing Error]:', enhErr?.message || enhErr)
        return NextResponse.json(
          { error: `Media Enhancement failed: ${enhErr?.message || 'Processing error'}. Please try a shorter duration or balanced profile.` },
          { status: 500 }
        )
      }
    }

    const cleanTitle = (title || 'download').slice(0, 40).replace(/[^\w\s.-]/gi, '_')
    const ext = isAudio ? 'mp3' : 'mp4'
    const cleanFileName = `${cleanTitle}.${ext}`

    // Bandwidth Optimization: For standard full-length media downloads, redirect the client
    // DIRECTLY to the source CDN (Cloudflare/SaveTube/TikTok/Instagram/Google CDN).
    // This reduces Vercel Fast Origin Transfer from 100MB+ per file down to ~350 bytes (307 redirect header),
    // preventing the free-tier 10 GB limit from ever getting exhausted.
    if (isGetRequest) {
      return NextResponse.redirect(targetDownloadUrl, {
        status: 307,
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    return NextResponse.json({ redirectUrl: targetDownloadUrl, filename: cleanFileName })
  } catch (err: any) {
    console.error('[Download Route Error]:', err?.message || err)
    return NextResponse.json(
      { error: err?.message || 'Download stream failed. Please try a different quality format.' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url') || undefined
  const quality = searchParams.get('quality') || undefined
  const mediaType = (searchParams.get('mediaType') as any) || 'video'
  const downloadUrl = searchParams.get('downloadUrl') || undefined
  const title = searchParams.get('title') || 'download'
  const trimEnabled = searchParams.get('trimEnabled') === 'true'
  const trimStart = parseFloat(searchParams.get('trimStart') || '0')
  const trimEnd = parseFloat(searchParams.get('trimEnd') || '0')
  const aspectRatio = (searchParams.get('aspectRatio') as any) || 'original'

  const enhancement = trimEnabled
    ? {
        enabled: true,
        trimEnabled: true,
        trimStart,
        trimEnd,
        aspectRatio,
        compressionLevel: 'original' as const,
        audioBitrate: '320k' as const,
        normalizeAudio: false,
        muteAudio: false,
      }
    : undefined

  return handleDownload({
    url,
    quality,
    mediaType,
    downloadUrl,
    title,
    enhancement,
    isGetRequest: true,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return handleDownload({ ...body, isGetRequest: false })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Invalid request body' }, { status: 400 })
  }
}