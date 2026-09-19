import { existsSync } from 'fs'

export function getFfmpegLocation(): string {
  const scriptsDir = 'C:\\Users\\LENOVO\\AppData\\Roaming\\Python\\Python314\\Scripts'
  if (existsSync(`${scriptsDir}\\ffmpeg.exe`)) {
    return scriptsDir
  }
  return 'ffmpeg'
}

export function getYtDlpCommand(): string {
  return process.platform === 'win32' ? 'python -m yt_dlp' : 'yt-dlp'
}
