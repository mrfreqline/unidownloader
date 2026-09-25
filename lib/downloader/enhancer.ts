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
  aspectRatio?: 'original' | '16:9' | '9:16' | '1:1'
  targetQuality?: string
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
  baseTitle: string,
  secondaryAudioUrl?: string
): Promise<EnhancedResult> {
  ensureFfmpeg()

  const isAudioMode =
    mediaType === 'audio' ||
    ['mp3', 'wav', 'flac', 'aac'].includes((settings.targetFormat || '').toLowerCase())

  const rawExt = (settings.targetFormat || (isAudioMode ? 'mp3' : 'mp4')).toLowerCase()
  const ext = rawExt.replace(/^\./, '')
  const safeTitle = (baseTitle || 'media').slice(0, 35).replace(/[^\w\s.-]/gi, '_')

  // Support up to 5-minute (300 seconds) clips / ringtones
  const trimStart = typeof settings.trimStart === 'number' ? Math.max(0, settings.trimStart) : 0
  let trimDuration = 60
  if (settings.trimEnabled && typeof settings.trimEnd === 'number' && settings.trimEnd > trimStart) {
    trimDuration = Math.min(300, Math.max(1, settings.trimEnd - trimStart))
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
    // Dynamic execution safety guard: 90s for clips, 10 minutes for full videos
    const maxTimeout = settings.trimEnabled ? 90000 : 600000
    const timeoutTimer = setTimeout(() => {
      try {
        cleanup()
      } catch {}
      reject(new Error(settings.trimEnabled ? 'Clip extraction timed out. Please try a shorter duration.' : 'Media processing timed out.'))
    }, maxTimeout)

    try {
      const cmd = ffmpeg()

      // When trimming is enabled, use fast input-seeking directly over HTTP
      if (settings.trimEnabled && inputUrl.startsWith('http')) {
        let referer = 'https://www.google.com/'
        try {
          const u = new URL(inputUrl)
          if (u.hostname.includes('savetube')) referer = 'https://yt.savetube.me/'
          else if (u.hostname.includes('tikwm')) referer = 'https://www.tikwm.com/'
          else if (u.hostname.includes('instagram') || u.hostname.includes('fbcdn')) referer = 'https://www.instagram.com/'
        } catch {}

        cmd.input(inputUrl)
        cmd.inputOptions([
          '-user_agent', userAgent,
          '-referer', referer,
          '-ss', trimStart.toString(),
        ])

        // If secondary separate audio stream is provided (e.g. YouTube 4K/1080p DASH), ingest it as second input
        const hasSeparateAudio = Boolean(secondaryAudioUrl && secondaryAudioUrl !== inputUrl && !isAudioMode)
        if (hasSeparateAudio && secondaryAudioUrl) {
          cmd.input(secondaryAudioUrl)
          cmd.inputOptions([
            '-user_agent', userAgent,
            '-referer', referer,
            '-ss', trimStart.toString(),
          ])
        }

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
          // Video clipping: aspect ratio conversion or clean keyframe rendering
          const ratio = settings.aspectRatio
          const mapOpts = hasSeparateAudio ? ['-map', '0:v:0', '-map', '1:a:0?'] : []
          const is4KTier = inputUrl.includes('2160') || inputUrl.includes('1440') || (settings as any).targetQuality?.includes('4K') || (settings as any).targetQuality?.includes('2160')
          const scaleW = is4KTier ? 2160 : 1080
          const scaleH = is4KTier ? 3840 : 1920

          // Universal smooth playback flags: hardware-optimized ultrafast encoding to prevent serverless timeouts
          const smoothVideoFlags = [
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-tune', 'fastdecode',
            '-threads', '4',
            '-pix_fmt', 'yuv420p',
            '-r', '30',
            '-fps_mode', 'cfr',
            '-g', '60',
            '-crf', is4KTier ? '18' : '22',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-movflags', '+faststart',
            '-avoid_negative_ts', 'make_zero',
            '-fflags', '+genpts',
          ]

          if (ratio === '9:16') {
            // TikTok / Reels 9:16 vertical pad (1080x1920 or 2160x3840 for 4K)
            cmd.outputOptions([
              ...mapOpts,
              '-vf', `scale=${scaleW}:${scaleH}:force_original_aspect_ratio=decrease,pad=${scaleW}:${scaleH}:(ow-iw)/2:(oh-ih)/2:black`,
              ...smoothVideoFlags,
            ])
          } else if (ratio === '1:1') {
            // Square 1:1 pad (1080x1080 or 2160x2160 for 4K)
            const sqDim = is4KTier ? 2160 : 1080
            cmd.outputOptions([
              ...mapOpts,
              '-vf', `scale=${sqDim}:${sqDim}:force_original_aspect_ratio=decrease,pad=${sqDim}:${sqDim}:(ow-iw)/2:(oh-ih)/2:black`,
              ...smoothVideoFlags,
            ])
          } else if (ratio === '16:9') {
            // Landscape 16:9 pad (1920x1080 or 3840x2160 for 4K)
            const landW = is4KTier ? 3840 : 1920
            const landH = is4KTier ? 2160 : 1080
            cmd.outputOptions([
              ...mapOpts,
              '-vf', `scale=${landW}:${landH}:force_original_aspect_ratio=decrease,pad=${landW}:${landH}:(ow-iw)/2:(oh-ih)/2:black`,
              ...smoothVideoFlags,
            ])
          } else if (ext === 'gif') {
            cmd.outputOptions([
              '-vf',
              'fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
            ])
          } else {
            // Lightning-Fast Lossless Stream Copy: completes in ~1 second with 100% original quality
            cmd.outputOptions([
              ...mapOpts,
              '-c', 'copy',
              '-movflags', '+faststart',
              '-avoid_negative_ts', 'make_zero',
            ])
          }
        }
      } else {
        let referer = 'https://www.google.com/'
        try {
          const u = new URL(inputUrl)
          if (u.hostname.includes('savetube')) referer = 'https://yt.savetube.me/'
          else if (u.hostname.includes('tikwm')) referer = 'https://www.tikwm.com/'
          else if (u.hostname.includes('instagram') || u.hostname.includes('fbcdn')) referer = 'https://www.instagram.com/'
        } catch {}

        cmd.input(inputUrl)
        if (inputUrl.startsWith('http')) {
          cmd.inputOptions([
            '-user_agent', userAgent,
            '-referer', referer,
          ])
        }

        const hasSeparateAudio = Boolean(secondaryAudioUrl && secondaryAudioUrl !== inputUrl && !isAudioMode)
        if (hasSeparateAudio && secondaryAudioUrl) {
          cmd.input(secondaryAudioUrl)
          if (secondaryAudioUrl.startsWith('http')) {
            cmd.inputOptions([
              '-user_agent', userAgent,
              '-referer', referer,
            ])
          }
          cmd.outputOptions(['-map', '0:v:0', '-map', '1:a:0?', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-avoid_negative_ts', 'make_zero'])
        } else if (isAudioMode) {
          cmd.noVideo()
          if (ext === 'wav') {
            cmd.audioCodec('pcm_s16le')
          } else {
            cmd.audioCodec('libmp3lame').audioBitrate(settings.audioBitrate || '192k')
          }
        } else {
          cmd.outputOptions(['-c', 'copy', '-movflags', '+faststart', '-avoid_negative_ts', 'make_zero'])
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
