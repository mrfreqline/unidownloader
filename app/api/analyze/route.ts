import { NextRequest, NextResponse } from 'next/server'
import { resolveMediaUrl } from '@/lib/downloader/stream-resolver'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'Please provide a valid media URL' }, { status: 400 })
    }

    const result = await resolveMediaUrl(url)

    if (result.isMaintenance) {
      return NextResponse.json({
        isMaintenance: true,
        platform: 'YouTube',
        message: result.maintenanceMessage || 'YouTube engine is currently undergoing scheduled maintenance.',
      })
    }

    return NextResponse.json({
      title: result.title,
      thumbnail: result.thumbnail || '',
      duration: result.duration || '',
      uploader: result.uploader || 'Creator',
      platform: result.platform,
      qualities: result.qualities || ['1080p Full HD', '720p HD', 'Audio Only'],
      originalUrl: url,
      streamUrl: result.streamUrl || result.downloadUrl,
      downloadUrl: result.downloadUrl,
      audioUrl: result.audioUrl,
      isDirectMovie: result.isDirectMovie || false,
      fileSize: result.fileSize || '',
      folderData: result.folderData,
      fileType: result.fileType || 'video',
    })

  } catch (err: any) {
    console.error('[Analyze Error]:', err?.message || err)
    return NextResponse.json(
      { error: err?.message || 'Could not fetch media info. Ensure the link is public and try again.' },
      { status: 500 }
    )
  }
}