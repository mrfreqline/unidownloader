import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { readdirSync, readFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { getYtDlpCommand, getFfmpegLocation } from '@/lib/downloader/utils'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { url, quality, mediaType, enhancement } = await req.json()
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    const timestamp = Date.now()
    const tmpDir = tmpdir()
    const outputTemplate = join(tmpDir, `${timestamp}_%(title)s.%(ext)s`)

    const ytdlp = getYtDlpCommand()
    const ffmpegLocation = getFfmpegLocation()

    let formatArg = ''
    const isAudio = mediaType === 'audio' || quality === 'Audio Only' || quality === 'mp3'

    if (isAudio) {
      formatArg = `-x --audio-format mp3 --audio-quality 0 --ffmpeg-location "${ffmpegLocation}"`
    } else if (quality === '4K') {
      formatArg = `-f "bestvideo[height<=2160]+bestaudio/best" --merge-output-format mp4 --ffmpeg-location "${ffmpegLocation}"`
    } else if (quality === '1080p') {
      formatArg = `-f "bestvideo[height<=1080]+bestaudio/best" --merge-output-format mp4 --ffmpeg-location "${ffmpegLocation}"`
    } else if (quality === '720p') {
      formatArg = `-f "bestvideo[height<=720]+bestaudio/best" --merge-output-format mp4 --ffmpeg-location "${ffmpegLocation}"`
    } else if (quality === '360p') {
      formatArg = `-f "bestvideo[height<=360]+bestaudio/best" --merge-output-format mp4 --ffmpeg-location "${ffmpegLocation}"`
    } else {
      formatArg = `-f "bestvideo+bestaudio/best" --merge-output-format mp4 --ffmpeg-location "${ffmpegLocation}"`
    }

    // Media Enhancement: Trimming support via yt-dlp / ffmpeg
    if (enhancement?.trimEnabled && enhancement?.trimEnd > enhancement?.trimStart) {
      formatArg += ` --download-sections "*${enhancement.trimStart}-${enhancement.trimEnd}"`
    }

    const command = `${ytdlp} ${formatArg} --no-warnings -o "${outputTemplate}" --no-playlist "${url}"`
    console.log('[Downloader] Executing:', command)

    await execAsync(command, { timeout: 300000 })

    // Find the generated output file
    const files = readdirSync(tmpDir).filter(f => f.startsWith(`${timestamp}_`))
    if (files.length === 0) {
      return NextResponse.json({ error: 'Download engine completed but output file was not found.' }, { status: 500 })
    }

    const filePath = join(tmpDir, files[0])
    const fileBuffer = readFileSync(filePath)
    const rawFileName = files[0].replace(`${timestamp}_`, '')
    const cleanFileName = rawFileName.replace(/[^\w\s.-]/gi, '_')

    // EPHEMERAL PURGE: Unlink immediately after reading into RAM
    try {
      if (existsSync(filePath)) unlinkSync(filePath)
    } catch (e) {
      console.warn('[Downloader] Temp file unlink warning:', e)
    }

    const ext = cleanFileName.split('.').pop()?.toLowerCase() || (isAudio ? 'mp3' : 'mp4')
    const mimeType = ext === 'mp3' ? 'audio/mpeg' : ext === 'webm' ? 'video/webm' : 'video/mp4'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${cleanFileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })

  } catch (err: any) {
    console.error('[Downloader Error]:', err?.message || err)
    return NextResponse.json(
      { error: err?.message ? `Engine error: ${err.message.slice(0, 150)}` : 'Download failed. Please try a different format.' },
      { status: 500 }
    )
  }
}