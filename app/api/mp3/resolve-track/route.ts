import { NextRequest, NextResponse } from 'next/server'
import { searchYouTubeVideo } from '@/lib/downloader/playlist-resolver'

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Missing search query.' }, { status: 400 })
    }

    const hit = await searchYouTubeVideo(query.trim())
    if (!hit) {
      return NextResponse.json(
        { error: `No public YouTube match found for “${query.trim()}”.` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      videoId: hit.videoId,
      title: hit.title,
      thumbnail: hit.thumbnail,
      youtubeUrl: `https://www.youtube.com/watch?v=${hit.videoId}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'YouTube search failed.' }, { status: 500 })
  }
}
