import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { pipeline } from 'stream/promises'

function getFfmpegBinary(): string {
  // On Linux (Vercel Lambda), copy binary to /tmp and ensure 0o755 permissions
  if (process.platform === 'linux') {
    const tmpBinary = path.join(os.tmpdir(), 'ffmpeg')
    if (fs.existsSync(tmpBinary)) {
      try {
        fs.chmodSync(tmpBinary, 0o755)
        return tmpBinary
      } catch {}
    }

    const candidates = [
      typeof ffmpegPath === 'string' ? ffmpegPath : '',
      path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg'),
      path.join(process.cwd(), '.next', 'server', 'node_modules', 'ffmpeg-static', 'ffmpeg'),
      '/var/task/node_modules/ffmpeg-static/ffmpeg',
    ].filter(Boolean)

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        try {
          fs.copyFileSync(cand, tmpBinary)
          fs.chmodSync(tmpBinary, 0o755)
          return tmpBinary
        } catch (e) {
          console.warn('[FFmpeg copy to /tmp failed]:', e)
        }
      }
    }
  }

  // Windows or local fallback
  const localBinary = path.join(
    process.cwd(),
    'node_modules',
    'ffmpeg-static',
    process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
  )
  if (fs.existsSync(localBinary)) {
    return localBinary
  }
  return typeof ffmpegPath === 'string' ? ffmpegPath : 'ffmpeg'
}

function ensureFfmpeg() {
  try {
    const bin = getFfmpegBinary()
    ffmpeg.setFfmpegPath(bin)
  } catch (err) {
    console.warn('[FFmpeg binary path warn]:', err)
  }
}

export interface EnhancementSettings {
  enabled: boolean
  trimEnabled?: boolean
  trimStart?: number
  trimEnd?: number
  compressionLevel?: 'original' | 'balanced' | 'small'
  targetFormat?: string
  audioBitrate?: '128k' | '192k' | '320k'
  normalizeAudio?: boolean
  muteAudio?: boolean
}

export interface EnhancedResult {
  filePath: string
  fileName: string
  contentType: string
  cleanup: () => void
}

const MIME_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  gif: 'image/gif',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  aac: 'audio/aac',
}

export async function processMediaEnhancement(
  inputUrl: string,
  mediaType: 'video' | 'audio' | 'image',
  settings: EnhancementSettings,
  baseTitle: string
): Promise<EnhancedResult> {
  ensureFfmpeg()

  const isAudioMode =
    mediaType === 'audio' ||
    ['mp3', 'wav', 'flac', 'aac'].includes((settings.targetFormat || '').toLowerCase())

  const rawExt = (settings.targetFormat || (isAudioMode ? 'mp3' : 'mp4')).toLowerCase()
  const ext = rawExt.replace(/^\./, '')
  const safeTitle = (baseTitle || 'media').slice(0, 35).replace(/[^\w\s.-]/gi, '_')

  // Enforce 60-second limit for trimmed clips / ringtones
  const trimStart = typeof settings.trimStart === 'number' ? Math.max(0, settings.trimStart) : 0
  let trimDuration = 60
  if (settings.trimEnabled && typeof settings.trimEnd === 'number' && settings.trimEnd > trimStart) {
    trimDuration = Math.min(60, Math.max(1, settings.trimEnd - trimStart))
  }

  const clipSuffix = settings.trimEnabled
    ? isAudioMode
      ? '_ringtone'
      : `_clip_${Math.round(trimDuration)}s`
    : ''
  const fileName = `${safeTitle}${clipSuffix}.${ext}`

  const outPath = path.join(
    os.tmpdir(),
    `a2z_enh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  )
  const tempInputPath = path.join(
    os.tmpdir(),
    `a2z_in_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.tmp`
  )

  const cleanup = () => {
    try {
      if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath)
    } catch {}
    try {
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath)
    } catch {}
  }

  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

  return new Promise<EnhancedResult>(async (resolve, reject) => {
    // 25-second execution safety guard
    const timeoutTimer = setTimeout(() => {
      try {
        cleanup()
      } catch {}
      reject(new Error('Clip extraction timed out. Please try a shorter duration.'))
    }, 25000)

    try {
      const cmd = ffmpeg()

      // When trimming is enabled, use fast input-seeking directly over HTTP
      // This avoids pre-downloading large 100MB+ source files to disk!
      if (settings.trimEnabled && inputUrl.startsWith('http')) {
        cmd.input(inputUrl)
        cmd.inputOptions([
          '-user_agent', userAgent,
          '-referer', 'https://www.google.com/',
          '-ss', trimStart.toString(),
        ])
        cmd.duration(trimDuration)

        if (isAudioMode) {
          cmd.noVideo()
          if (ext === 'wav') {
            cmd.audioCodec('pcm_s16le')
          } else {
            cmd.audioCodec('libmp3lame').audioBitrate(settings.audioBitrate || '192k')
          }
          if (settings.normalizeAudio) {
            cmd.audioFilters('loudnorm=I=-16:TP=-1.5:LRA=11')
          }
        } else {
          // Video clipping: Use fast stream copy (-c copy) when container matches, or fast ultrafast encode
          if (ext === 'mp4' || ext === 'mkv') {
            cmd.outputOptions([
              '-c', 'copy',
              '-avoid_negative_ts', 'make_zero',
            ])
          } else if (ext === 'gif') {
            cmd.outputOptions([
              '-vf',
              'fps=10,scale=400:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
            ])
          } else {
            cmd.outputOptions(['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '24'])
          }
        }
      } else {
        // Standard full file processing: pre-fetch stream with timeout
        try {
          const streamRes = await fetch(inputUrl, {
            headers: {
              'User-Agent': userAgent,
              'Accept': '*/*',
              'Referer': 'https://www.google.com/',
            },
            signal: AbortSignal.timeout(20000),
          })

          if (!streamRes.ok || !streamRes.body) {
            throw new Error(`Failed to fetch media stream (${streamRes.status})`)
          }

          const fileStream = fs.createWriteStream(tempInputPath)
          // @ts-ignore
          await pipeline(streamRes.body, fileStream)
        } catch (fetchErr: any) {
          cleanup()
          clearTimeout(timeoutTimer)
          return reject(new Error(`Source stream fetch failed: ${fetchErr?.message || fetchErr}`))
        }

        cmd.input(tempInputPath)

        if (isAudioMode) {
          cmd.noVideo()
          if (ext === 'wav') {
            cmd.audioCodec('pcm_s16le')
          } else {
            cmd.audioCodec('libmp3lame').audioBitrate(settings.audioBitrate || '192k')
          }
        } else {
          cmd.outputOptions(['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '24'])
        }
      }

      cmd
        .output(outPath)
        .on('end', () => {
          clearTimeout(timeoutTimer)
          try {
            if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath)
          } catch {}

          if (!fs.existsSync(outPath) || fs.statSync(outPath).size === 0) {
            cleanup()
            return reject(new Error('Clip extraction failed to generate output.'))
          }

          resolve({
            filePath: outPath,
            fileName,
            contentType: MIME_TYPES[ext] || 'application/octet-stream',
            cleanup,
          })
        })
        .on('error', (err: any) => {
          clearTimeout(timeoutTimer)
          cleanup()
          console.error('[FFmpeg Enhancer Error]:', err?.message || err)
          reject(err)
        })

      cmd.run()
    } catch (err: any) {
      clearTimeout(timeoutTimer)
      cleanup()
      reject(err)
    }
  })
}
