import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

import { getYtDlpCommand } from '@/lib/downloader/utils'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
    }

    const ytdlp = getYtDlpCommand()
    const { stdout } = await execAsync(
      `${ytdlp} --dump-json --no-playlist "${url}"`,
      { timeout: 60000 }
    )
    
    const info = JSON.parse(stdout)
    const formats = info.formats || []
    const qualities: string[] = []

    if (formats.some((f: any) => f.height >= 2160)) qualities.push('4K')
    if (formats.some((f: any) => f.height >= 1080)) qualities.push('1080p')
    if (formats.some((f: any) => f.height >= 720)) qualities.push('720p')
    if (formats.some((f: any) => f.height >= 360)) qualities.push('360p')
    qualities.push('Audio Only')

    return NextResponse.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: formatDuration(info.duration),
      uploader: info.uploader || info.channel || 'Unknown',
      platform: info.extractor_key,
      qualities,
      originalUrl: url,
    })

  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: 'Could not fetch video info. Check the URL and try again.' },
      { status: 500 }
    )
  }
}

function formatDuration(seconds: number): string {
  if (!seconds) return 'Unknown'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}