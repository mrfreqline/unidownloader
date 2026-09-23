import { NextRequest, NextResponse } from 'next/server'
import { isPlaylistOrCollectionUrl, listPlaylistTracks } from '@/lib/downloader/playlist-resolver'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'Please paste a YouTube playlist or Spotify link.' }, { status: 400 })
    }

    const trimmed = url.trim()
    if (!isPlaylistOrCollectionUrl(trimmed)) {
      return NextResponse.json({ error: 'Not a playlist/album/track collection link.', code: 'NOT_PLAYLIST' }, { status: 400 })
    }

    const result = await listPlaylistTracks(trimmed)
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    console.error('[MP3 Playlist Error]:', err?.message || err)
    return NextResponse.json(
      { error: err?.message || 'Could not load this playlist. Make sure it is public.' },
      { status: 500 }
    )
  }
}
