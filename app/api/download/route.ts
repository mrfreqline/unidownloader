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
    const isAudio = mediaType === 'audio' || quality === 'Audio Only' || quality === 'mp3'

    // If targetDownloadUrl was not provided by the client, resolve it from the media URL
    if (!targetDownloadUrl && url) {
      try {
        const resolved = await resolveMediaUrl(url)
        targetDownloadUrl = (isAudio ? resolved.audioUrl : null) || resolved.downloadUrl || resolved.streamUrl
      } catch {}
    }

    if (!targetDownloadUrl) {
      return NextResponse.json(
        { error: 'Could not extract direct stream. Please try another link.' },
        { status: 400 }
      )
    }

    const needsAudioExtraction =
      isAudio &&
      targetDownloadUrl &&
      !targetDownloadUrl.toLowerCase().includes('.mp3') &&
      !targetDownloadUrl.toLowerCase().includes('audio/mpeg')

    // Check if user requested Media Enhancement or needs audio extracted to MP3 from a video stream
    if ((enhancement && enhancement.enabled) || needsAudioExtraction) {
      try {
        const effectiveEnhancement =
          enhancement && enhancement.enabled
            ? enhancement
            : {
                enabled: true,
                targetFormat: 'mp3' as const,
                audioBitrate: '320k' as const,
                compressionLevel: 'original' as const,
                normalizeAudio: false,
                muteAudio: false,
                trimEnabled: false,
                trimStart: 0,
                trimEnd: 0,
              }

        const enhanced = await processMediaEnhancement(
          targetDownloadUrl,
          isAudio ? 'audio' : (mediaType || 'video'),
          effectiveEnhancement,
          title
        )

        const fileBuffer = fs.readFileSync(enhanced.filePath)
        enhanced.cleanup()

        // Direct stream trimmed clip or ringtone directly (< 25MB) so browser saves immediately to disk
        if (fileBuffer.length < 25 * 1024 * 1024 || (!process.env.NEXT_PUBLIC_SUPABASE_URL)) {
          const responseHeaders = new Headers()
          responseHeaders.set('Content-Type', enhanced.contentType)
          responseHeaders.set('Content-Disposition', `attachment; filename="${enhanced.fileName}"`)
          responseHeaders.set('Content-Length', fileBuffer.length.toString())

          return new NextResponse(fileBuffer, {
            headers: responseHeaders,
          })
        }

        // Upload large files (> 25MB) to Supabase ephemeral storage
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (supabaseUrl && supabaseKey) {
          try {
            const { createClient } = await import('@supabase/supabase-js')
            const sb = createClient(supabaseUrl, supabaseKey)
            const storageKey = `enh_${Date.now()}_${enhanced.fileName}`

            const { error: uploadError } = await sb.storage
              .from('ephemeral-downloads')
              .upload(storageKey, fileBuffer, {
                contentType: enhanced.contentType,
                upsert: true,
              })

            if (!uploadError) {
              const { data: urlData } = sb.storage
                .from('ephemeral-downloads')
                .getPublicUrl(storageKey)

              if (urlData?.publicUrl) {
                return NextResponse.json({
                  redirectUrl: urlData.publicUrl,
                  filename: enhanced.fileName,
                })
              }
            } else {
              console.warn('[Supabase Ephemeral Storage Upload Warning]:', uploadError)
            }
          } catch (sbErr) {
            console.warn('[Supabase Ephemeral Storage Error]:', sbErr)
          }
        }

        // Direct stream trimmed clip or ringtone to the user's browser
        const responseHeaders = new Headers()
        responseHeaders.set('Content-Type', enhanced.contentType)
        responseHeaders.set('Content-Disposition', `attachment; filename="${enhanced.fileName}"`)
        responseHeaders.set('Content-Length', fileBuffer.length.toString())

        return new NextResponse(fileBuffer, {
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

    // Audio streams (~3-10MB) are streamed through serverless proxy as blobs for 100% reliable instant saves.
    // Video direct high-speed CDN URLs (SaveTube Cloudflare, TikWM, ShareBox CDN, etc.) are delivered directly to the client
    const isDirectCdn =
      !isAudio && (
        targetDownloadUrl.includes('savetube') ||
        targetDownloadUrl.includes('tikwm') ||
        targetDownloadUrl.includes('fxtwitter') ||
        targetDownloadUrl.includes('pbcshsnp.com') ||
        targetDownloadUrl.includes('cshsnpcwio') ||
        targetDownloadUrl.includes('rapidcdn.app') ||
        targetDownloadUrl.includes('snapxcdn.com')
      )

    if (isDirectCdn) {
      return NextResponse.json({ redirectUrl: targetDownloadUrl, filename: cleanFileName })
    }

    try {
      const isIgCdn =
        targetDownloadUrl.includes('cdninstagram.com') ||
        targetDownloadUrl.includes('fbcdn.net') ||
        targetDownloadUrl.includes('instagram.com')
      const remoteRes = await fetch(targetDownloadUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...(isIgCdn ? { Referer: 'https://www.instagram.com/', Origin: 'https://www.instagram.com' } : {}),
        },
        signal: AbortSignal.timeout(20000),
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