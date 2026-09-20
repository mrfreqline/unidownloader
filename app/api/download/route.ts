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

        // Upload enhanced media to high-speed Supabase ephemeral CDN
        // This completely overcomes Vercel's 4.5MB serverless payload limit & timeout constraints
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

        // Direct stream fallback for smaller files (< 4.2MB)
        if (fileBuffer.length < 4.2 * 1024 * 1024) {
          const responseHeaders = new Headers()
          responseHeaders.set('Content-Type', enhanced.contentType)
          responseHeaders.set('Content-Disposition', `attachment; filename="${enhanced.fileName}"`)
          responseHeaders.set('Content-Length', fileBuffer.length.toString())

          return new NextResponse(fileBuffer, {
            headers: responseHeaders,
          })
        }

        return NextResponse.json(
          { error: 'Enhanced media file exceeded serverless transmission limits. Please select a shorter duration or balanced compression.' },
          { status: 500 }
        )
      } catch (enhErr: any) {
        console.error('[Enhancement Processing Error]:', enhErr?.message || enhErr)
        return NextResponse.json(
          { error: `Media Enhancement failed: ${enhErr?.message || 'Processing error'}. Please try a shorter duration or balanced profile.` },
          { status: 500 }
        )
      }
    }

    const cleanTitle = (title || 'download').slice(0, 40).replace(/[^\w\s.-]/gi, '_')
    const isAudio = mediaType === 'audio' || quality === 'Audio Only' || quality === 'mp3'
    const ext = isAudio ? 'mp3' : 'mp4'
    const cleanFileName = `${cleanTitle}.${ext}`

    // Direct high-speed CDN URLs (SaveTube Cloudflare, TikWM, etc.) are delivered directly to the client
    // This avoids Vercel Serverless Function 4.5MB body limits and 10s execution timeouts
    const isDirectCdn =
      targetDownloadUrl.includes('savetube') ||
      targetDownloadUrl.includes('tikwm') ||
      targetDownloadUrl.includes('fxtwitter')

    if (isDirectCdn) {
      return NextResponse.json({ redirectUrl: targetDownloadUrl, filename: cleanFileName })
    }

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