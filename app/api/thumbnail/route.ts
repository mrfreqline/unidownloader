import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { thumbnailUrl, title } = await req.json()

    if (!thumbnailUrl) {
      return NextResponse.json({ error: 'No thumbnail URL provided' }, { status: 400 })
    }

    const response = await fetch(thumbnailUrl)
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch thumbnail image' }, { status: 500 })
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const safeTitle = (title || 'cover').replace(/[^\w\s.-]/gi, '_').slice(0, 50)
    const fileName = `${safeTitle}_cover.jpg`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (err: any) {
    console.error('[Thumbnail Error]:', err)
    return NextResponse.json({ error: 'Failed to download cover image.' }, { status: 500 })
  }
}