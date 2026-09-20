import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import path from 'path'
import os from 'os'
import fs from 'fs'

function getFfmpegBinary(): string {
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

try {
  ffmpeg.setFfmpegPath(getFfmpegBinary())
} catch (err) {
  console.warn('[FFmpeg binary path warn]:', err)
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
  const isAudioMode =
    mediaType === 'audio' ||
    ['mp3', 'wav', 'flac', 'aac'].includes((settings.targetFormat || '').toLowerCase())

  const rawExt = (settings.targetFormat || (isAudioMode ? 'mp3' : 'mp4')).toLowerCase()
  const ext = rawExt.replace(/^\./, '')
  const safeTitle = (baseTitle || 'enhanced_media').slice(0, 40).replace(/[^\w\s.-]/gi, '_')
  const fileName = `${safeTitle}.${ext}`
  const outPath = path.join(
    os.tmpdir(),
    `a2z_enh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  )

  const cleanup = () => {
    try {
      if (fs.existsSync(outPath)) {
        fs.unlinkSync(outPath)
      }
    } catch {
      // Ignore cleanup error
    }
  }

  return new Promise<EnhancedResult>((resolve, reject) => {
    try {
      const cmd = ffmpeg(inputUrl)

      // 1. Trimming
      if (
        settings.trimEnabled &&
        typeof settings.trimStart === 'number' &&
        typeof settings.trimEnd === 'number' &&
        settings.trimEnd > settings.trimStart
      ) {
        cmd.setStartTime(Math.max(0, settings.trimStart))
        cmd.setDuration(settings.trimEnd - settings.trimStart)
      }

      // 2. Audio Processing
      if (isAudioMode) {
        cmd.noVideo()

        if (ext === 'wav') {
          cmd.audioCodec('pcm_s16le')
        } else if (ext === 'flac') {
          cmd.audioCodec('flac')
        } else if (ext === 'aac') {
          cmd.audioCodec('aac').audioBitrate(settings.audioBitrate || '320k')
        } else {
          cmd.audioCodec('libmp3lame').audioBitrate(settings.audioBitrate || '320k')
        }

        if (settings.normalizeAudio) {
          cmd.audioFilters('loudnorm=I=-16:TP=-1.5:LRA=11')
        }
      } else {
        // 3. Video Processing
        if (settings.muteAudio) {
          cmd.noAudio()
        } else {
          cmd.audioBitrate(settings.audioBitrate || '192k')
          if (settings.normalizeAudio) {
            cmd.audioFilters('loudnorm=I=-16:TP=-1.5:LRA=11')
          }
        }

        // Output container & compression
        if (ext === 'gif') {
          cmd.outputOptions([
            '-vf',
            'fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
          ])
        } else if (ext === 'webm') {
          const crfVal = settings.compressionLevel === 'small' ? '36' : '30'
          cmd.outputOptions(['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', crfVal])
        } else if (ext === 'mkv') {
          const crfVal = settings.compressionLevel === 'small' ? '28' : '23'
          cmd.outputOptions(['-c:v', 'libx264', '-preset', 'veryfast', '-crf', crfVal])
        } else {
          // Default MP4
          if (settings.compressionLevel === 'small') {
            cmd.outputOptions([
              '-c:v',
              'libx264',
              '-preset',
              'veryfast',
              '-crf',
              '28',
              '-vf',
              "scale='min(1280,iw)':-2",
            ])
          } else if (settings.compressionLevel === 'balanced') {
            cmd.outputOptions(['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23'])
          } else {
            // Original / High fidelity
            cmd.outputOptions(['-c:v', 'libx264', '-preset', 'fast', '-crf', '18'])
          }
        }
      }

      // Execution timeout guard (90 seconds)
      const timeoutTimer = setTimeout(() => {
        try {
          (cmd as any).kill('SIGKILL')
        } catch {}
        cleanup()
        reject(new Error('Media enhancement timed out. Please try a shorter duration or balanced profile.'))
      }, 90000)

      cmd
        .output(outPath)
        .on('end', () => {
          clearTimeout(timeoutTimer)
          if (!fs.existsSync(outPath)) {
            return reject(new Error('Enhancement output file was not created.'))
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
      cleanup()
      reject(err)
    }
  })
}
