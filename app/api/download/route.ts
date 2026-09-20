import { NextRequest, NextResponse } from 'next/server'
import { resolveMediaUrl } from '@/lib/downloader/stream-resolver'
import { processMediaEnhancement } from '@/lib/downloader/enhancer'
import dns from 'dns'
import fs from 'fs'

try {
  dns.setDefaultResultOrder('ipv4first')
} catch {}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url, quality, mediaType, downloadUrl: providedDownloadUrl, title = 'media', enhancement } = body

    if (!url && !providedDownloadUrl) {
      return NextResponse.json({ error: 'No media URL provided' }, { status: 400 })
    }

    let targetDownloadUrl = providedDownloadUrl

    // If downloadUrl not passed from client, resolve dynamically
    if (!targetDownloadUrl && url) {
      const resolved = await resolveMediaUrl(url)
      targetDownloadUrl =
        mediaType === 'audio' && resolved.audioUrl ? resolved.audioUrl : resolved.downloadUrl
    }

    if (!targetDownloadUrl) {
      return NextResponse.json(
        { error: 'Could not extract direct stream. Please try another link.' },
        { status: 400 }
      )
    }

    // Check if user requested Media Enhancement (trim, compress, convert container, audio normalize)
    if (enhancement && enhancement.enabled) {
      try {
        const enhanced = await processMediaEnhancement(
          targetDownloadUrl,
          mediaType || 'video',
          enhancement,
          title
        )

        const fileBuffer = fs.readFileSync(enhanced.filePath)
        enhanced.cleanup()

        const responseHeaders = new Headers()
        responseHeaders.set('Content-Type', enhanced.contentType)
        responseHeaders.set('Content-Disposition', `attachment; filename="${enhanced.fileName}"`)
        responseHeaders.set('Content-Length', fileBuffer.length.toString())

        return new NextResponse(fileBuffer, {
          headers: responseHeaders,
        })
      } catch (enhErr: any) {
        console.warn('[Enhancement Fallback to direct stream]:', enhErr?.message || enhErr)
      }
    }

    const cleanTitle = (title || 'download').slice(0, 40).replace(/[^\w\s.-]/gi, '_')
    const isAudio = mediaType === 'audio' || quality === 'Audio Only' || quality === 'mp3'
    const ext = isAudio ? 'mp3' : 'mp4'
    const cleanFileName = `${cleanTitle}.${ext}`

    try {
      const remoteRes = await fetch(targetDownloadUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })

      if (!remoteRes.ok || !remoteRes.body) {
        // Fallback: Return redirect link if remote server prevents proxying
        return NextResponse.json({ redirectUrl: targetDownloadUrl, filename: cleanFileName })
      }

      const contentType =
        remoteRes.headers.get('content-type') || (isAudio ? 'audio/mpeg' : 'video/mp4')
      const contentLength = remoteRes.headers.get('content-length')

      const responseHeaders = new Headers()
      responseHeaders.set('Content-Type', contentType)
      responseHeaders.set('Content-Disposition', `attachment; filename="${cleanFileName}"`)
      if (contentLength) {
        responseHeaders.set('Content-Length', contentLength)
      }

      return new NextResponse(remoteRes.body as any, {
        headers: responseHeaders,
      })
    } catch {
      // Direct CDN download redirect fallback
      return NextResponse.json({ redirectUrl: targetDownloadUrl, filename: cleanFileName })
    }
  } catch (err: any) {
    console.error('[Download Route Error]:', err?.message || err)
    return NextResponse.json(
      { error: err?.message || 'Download stream failed. Please try a different quality format.' },
      { status: 500 }
    )
  }
}