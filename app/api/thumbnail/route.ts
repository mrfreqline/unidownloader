import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const targetUrl = body.thumbnailUrl || body.imageUrl || body.url
    const title = body.title || 'image'

    if (!targetUrl) {
      return NextResponse.json({ error: 'No image URL provided' }, { status: 400 })
    }

    const safeTitle = (title || 'image').replace(/[^\w\s.-]/gi, '_').slice(0, 50)

    try {
      let response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': targetUrl.includes('instagram.com')
            ? 'https://www.instagram.com/'
            : targetUrl.includes('facebook.com')
            ? 'https://www.facebook.com/'
            : '',
        },
        signal: AbortSignal.timeout(8000),
      }).catch(() => null)

      if (!response || !response.ok) {
        // Fallback fetch with crawler User-Agent that CDNs always allow
        response = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'TelegramBot (like TwitterBot)',
            'Accept': '*/*',
          },
          signal: AbortSignal.timeout(8000),
        }).catch(() => null)
      }

      if (!response || !response.ok) {
        // Fallback to direct client download if remote CDN blocks server proxy
        return NextResponse.json({ redirectUrl: targetUrl, filename: `${safeTitle}.jpg` })
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg'
      let ext = 'jpg'
      if (contentType.includes('png')) ext = 'png'
      else if (contentType.includes('webp')) ext = 'webp'
      else if (contentType.includes('gif')) ext = 'gif'
      else if (contentType.includes('svg')) ext = 'svg'

      const fileName = `${safeTitle}.${ext}`
      const buffer = Buffer.from(await response.arrayBuffer())

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': buffer.length.toString(),
        },
      })
    } catch {
      // Direct CDN download redirect fallback
      return NextResponse.json({ redirectUrl: targetUrl, filename: `${safeTitle}.jpg` })
    }
  } catch (err: any) {
    console.error('[Image Download Route Error]:', err)
    return NextResponse.json({ error: 'Failed to download image.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const targetUrl = searchParams.get('url')
    if (!targetUrl) {
      return new NextResponse('Missing url parameter', { status: 400 })
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': targetUrl.includes('instagram.com')
          ? 'https://www.instagram.com/'
          : targetUrl.includes('tiktok.com')
          ? 'https://www.tiktok.com/'
          : targetUrl.includes('facebook.com')
          ? 'https://www.facebook.com/'
          : '',
      },
      signal: AbortSignal.timeout(7000),
    }).catch(() => null)

    if (!response || !response.ok) {
      return NextResponse.redirect(targetUrl)
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = Buffer.from(await response.arrayBuffer())

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    })
  } catch {
    return new NextResponse('Image proxy error', { status: 500 })
  }
}