import { NextRequest, NextResponse } from 'next/server'
import { resolveMediaUrl } from '@/lib/downloader/stream-resolver'

function parseDurationToSeconds(val?: string | number): number {
  if (typeof val === 'number' && val > 0) return val
  if (!val || typeof val !== 'string') return 0
  const clean = val.trim()
  if (clean.includes(':')) {
    const parts = clean.split(':').map(p => Number(p.trim()))
    if (parts.every(n => !isNaN(n))) {
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
      if (parts.length === 2) return parts[0] * 60 + parts[1]
      if (parts.length === 1) return parts[0]
    }
  }
  const secMatch = clean.match(/^(\d+)\s*s/i)
  if (secMatch) return parseInt(secMatch[1], 10)
  const minMatch = clean.match(/(\d+)\s*(?:m|min|minute)/i)
  const sMatch = clean.match(/(\d+)\s*s/i)
  if (minMatch) {
    return parseInt(minMatch[1], 10) * 60 + (sMatch ? parseInt(sMatch[1], 10) : 0)
  }
  const num = Number(clean)
  if (!isNaN(num) && num > 0) return num
  return 0
}

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

    const durationSeconds = parseDurationToSeconds(result.duration)

    return NextResponse.json({
      title: result.title,
      thumbnail: result.thumbnail || '',
      duration: result.duration || '',
      durationSeconds: durationSeconds > 0 ? durationSeconds : 600,
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
      formats: result.formats,
      images: result.images,
    })

  } catch (err: any) {
    console.error('[Analyze Error]:', err?.message || err)
    return NextResponse.json(
      { error: err?.message || 'Could not fetch media info. Ensure the link is public and try again.' },
      { status: 500 }
    )
  }
}