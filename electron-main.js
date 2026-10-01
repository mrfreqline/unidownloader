// Electron Main Process for A2Z Downloader Windows Desktop App (.exe)
const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

// Helper to locate bundled or local engine binaries (yt-dlp & ffmpeg)
function getBinPath(binName) {
  // 1. Packaged extraResources in production (dist/win-unpacked/resources/bin)
  const prodPath = path.join(process.resourcesPath, 'bin', binName)
  if (fs.existsSync(prodPath)) return prodPath

  // 2. Development project root /bin
  const devPath = path.join(__dirname, 'bin', binName)
  if (fs.existsSync(devPath)) return devPath

  // 3. AppPath relative bin
  const appPath = path.join(app.getAppPath(), 'bin', binName)
  if (fs.existsSync(appPath)) return appPath

  return binName
}

// Active background processes map (downloadId -> child_process)
const activeProcesses = new Map()

// 0. Native Fast URL Extraction & Metadata Analysis (yt-dlp with Node JS runtime)
ipcMain.handle('native-analyze-media', async (event, targetUrl) => {
  const ytDlpPath = getBinPath('yt-dlp.exe')
  if (!fs.existsSync(ytDlpPath)) {
    return { success: false, error: 'Local extraction engine (yt-dlp) not found.' }
  }

  return new Promise((resolve) => {
    const args = ['--js-runtimes', 'node', '-j', '--no-playlist', targetUrl]
    const proc = spawn(ytDlpPath, args, { windowsHide: true })
    let stdoutData = ''
    let stderrData = ''

    proc.stdout.on('data', chunk => { stdoutData += chunk.toString() })
    proc.stderr.on('data', chunk => { stderrData += chunk.toString() })

    proc.on('close', (code) => {
      if (code === 0 && stdoutData) {
        try {
          const meta = JSON.parse(stdoutData)
          const rawFormats = Array.isArray(meta.formats) ? meta.formats : []

          const audioFormats = rawFormats.filter((f) => f.vcodec === 'none' && f.acodec !== 'none' && f.url && f.protocol === 'https')
          audioFormats.sort((a, b) => {
            const aIsM4a = a.ext === 'm4a' ? 1 : 0
            const bIsM4a = b.ext === 'm4a' ? 1 : 0
            if (bIsM4a !== aIsM4a) return bIsM4a - aIsM4a
            return (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0)
          })
          const bestAudio = audioFormats[0] || rawFormats.find((f) => f.acodec !== 'none' && f.url)

          const videoFormats = rawFormats.filter((f) => f.vcodec && f.vcodec !== 'none' && f.url && f.protocol === 'https')
          videoFormats.sort((a, b) => {
            const aIsMp4 = a.ext === 'mp4' ? 1 : 0
            const bIsMp4 = b.ext === 'mp4' ? 1 : 0
            if (bIsMp4 !== aIsMp4) return bIsMp4 - aIsMp4
            return (b.height || 0) - (a.height || 0)
          })

          const progFormats = rawFormats.filter((f) => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none' && f.url && f.protocol === 'https')
          progFormats.sort((a, b) => (b.height || 0) - (a.height || 0))

          const bestProg = progFormats[0] || videoFormats.find((f) => f.height <= 1080) || videoFormats[0]

          const availableFormats = []
          const qualities = []

          const heights = [2160, 1440, 1080, 720, 480, 360]
          for (const h of heights) {
            const match = videoFormats.find((f) => f.height === h)
            if (match) {
              const label = h >= 2160 ? '4K Ultra HD (2160p)' : h >= 1440 ? '2K Quad HD (1440p)' : h >= 1080 ? '1080p Full HD' : h >= 720 ? '720p HD' : `${h}p`
              if (!qualities.includes(label)) qualities.push(label)
              availableFormats.push({
                quality: h,
                label,
                url: match.url,
                type: 'video',
                audioUrl: bestAudio?.url,
              })
            }
          }

          if (bestAudio) {
            qualities.push('Audio Only')
            availableFormats.push({
              quality: 320,
              label: 'Audio Only (MP3)',
              url: bestAudio.url,
              type: 'audio',
            })
          }

          const durationSec = typeof meta.duration === 'number' ? meta.duration : undefined
          const durationStr = durationSec
            ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}`
            : undefined

          const realVideoStream = bestProg?.url || (videoFormats[0] && videoFormats[0].url) || targetUrl

          resolve({
            success: true,
            data: {
              title: meta.title,
              thumbnail: meta.thumbnail || '',
              duration: durationStr,
              durationSeconds: durationSec,
              uploader: meta.uploader || meta.channel || 'Creator',
              platform: meta.extractor_key || 'Direct Media',
              qualities: qualities.length > 0 ? qualities : ['1080p Full HD', '720p HD', 'Audio Only'],
              formats: availableFormats,
              streamUrl: realVideoStream,
              downloadUrl: realVideoStream,
              audioUrl: bestAudio?.url || realVideoStream,
              fileType: 'video',
              originalUrl: targetUrl,
            }
          })
        } catch (e) {
          resolve({ success: false, error: e.message })
        }
      } else {
        resolve({ success: false, error: stderrData || `yt-dlp exited with code ${code}` })
      }
    })
  })
})

// 1. Check Native Engine status
ipcMain.handle('native-engine-status', async () => {
  const ytDlpPath = getBinPath('yt-dlp.exe')
  const ffmpegPath = getBinPath('ffmpeg.exe')
  const isAvailable = fs.existsSync(ytDlpPath) && fs.existsSync(ffmpegPath)
  return {
    isAvailable,
    ytDlpPath,
    ffmpegPath,
    downloadsDir: app.getPath('downloads'),
  }
})

// 2. Start Native Multi-Threaded Download (Supports unlimited length, 4K/8K, and MP3)
ipcMain.handle('native-download-start', async (event, opts) => {
  const ytDlpPath = getBinPath('yt-dlp.exe')
  const ffmpegPath = getBinPath('ffmpeg.exe')
  const downloadsDir = app.getPath('downloads')
  const id = opts.id || ('dl_' + Date.now())

  if (!fs.existsSync(ytDlpPath)) {
    return { success: false, error: 'Native download engine (yt-dlp) not found.' }
  }

  // Cancel any existing task with this id
  if (activeProcesses.has(id)) {
    try { activeProcesses.get(id).kill() } catch { /* ignore */ }
    activeProcesses.delete(id)
  }

  const args = [
    '--ffmpeg-location', ffmpegPath,
    '--newline',
    '--no-colors',
    '--no-playlist',
    '--concurrent-fragments', '16',
  ]

  if (opts.audioOnly || opts.format === 'mp3') {
    args.push('-x', '--audio-format', 'mp3')
    args.push('-o', path.join(downloadsDir, '%(title)s.%(ext)s'))
  } else {
    let targetHeight = 0
    if (opts.height) {
      targetHeight = parseInt(opts.height, 10)
    } else if (opts.format) {
      const match = opts.format.match(/(\d{3,4})p?/i)
      if (match) targetHeight = parseInt(match[1], 10)
      if (opts.format.toLowerCase().includes('4k')) targetHeight = 2160
    }

    if (targetHeight > 0) {
      args.push('-f', `bestvideo[height<=${targetHeight}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${targetHeight}]+bestaudio/best`)
    } else {
      args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best')
    }
    args.push('--merge-output-format', 'mp4')
    args.push('-o', path.join(downloadsDir, '%(title)s.%(ext)s'))
  }

  args.push(opts.url)

  let detectedFile = null
  let lastProgress = 0

  const proc = spawn(ytDlpPath, args, { windowsHide: true })
  activeProcesses.set(id, proc)

  proc.stdout.on('data', (chunk) => {
    const text = chunk.toString()
    const lines = text.split(/[\r\n]+/)
    for (const line of lines) {
      if (!line.trim()) continue

      // Detect destination file path
      const destMatch = line.match(/(?:Destination|Merging formats into)\s*:\s*(.+)$/i) || line.match(/Merging formats into ["']?([^"']+)["']?/i)
      if (destMatch && destMatch[1]) {
        detectedFile = destMatch[1].trim()
      }

      // Detect percentage, size, speed, and ETA
      const progMatch = line.match(/\[download\]\s+([\d\.]+)%\s+of\s+(?:~?\s*([\d\.]+\w+))?\s+at\s+([\d\.]+\w+\/s)?\s+ETA\s+([\d:]+)?/i)
      if (progMatch) {
        lastProgress = parseFloat(progMatch[1])
        event.sender.send('native-download-progress', {
          id,
          percent: lastProgress,
          total: progMatch[2] || '',
          speed: progMatch[3] || '',
          eta: progMatch[4] || '',
          status: 'Downloading high-speed media stream...',
        })
      } else if (line.includes('[Merger]') || line.includes('Merging formats')) {
        event.sender.send('native-download-progress', {
          id,
          percent: 98,
          status: 'Merging audio and video tracks with FFmpeg...',
        })
      } else if (line.includes('[ExtractAudio]')) {
        event.sender.send('native-download-progress', {
          id,
          percent: 95,
          status: 'Converting audio to high-quality MP3...',
        })
      }
    }
  })

  proc.stderr.on('data', (chunk) => {
    console.warn(`[yt-dlp warning] ${chunk.toString().trim()}`)
  })

  proc.on('close', (code) => {
    activeProcesses.delete(id)
    if (code === 0) {
      event.sender.send('native-download-complete', {
        id,
        success: true,
        filePath: detectedFile || downloadsDir,
      })
    } else {
      event.sender.send('native-download-complete', {
        id,
        success: false,
        error: `Process completed with exit code ${code}`,
      })
    }
  })

  return { success: true, id }
})

// 3. Cancel Native Download
ipcMain.handle('native-download-cancel', async (event, id) => {
  if (activeProcesses.has(id)) {
    try {
      activeProcesses.get(id).kill()
    } catch { /* ignore */ }
    activeProcesses.delete(id)
    return { success: true }
  }
  return { success: false }
})

// 4. Open Downloads Folder or Specific File in Windows File Explorer
ipcMain.handle('native-open-folder', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath)
    return true
  }
  const downloadsDir = app.getPath('downloads')
  shell.openPath(downloadsDir)
  return true
})

// 5. Studio Native FFmpeg Render: Instant 9:16 Vertical Video / Clip Cutter
ipcMain.handle('native-render-clip', async (event, opts) => {
  const ffmpegPath = getBinPath('ffmpeg.exe')
  const downloadsDir = app.getPath('downloads')
  const id = opts.id || ('render_' + Date.now())
  const outPath = path.join(downloadsDir, `A2Z-Clip-${Date.now()}.mp4`)

  if (!fs.existsSync(ffmpegPath)) {
    return { success: false, error: 'FFmpeg rendering engine not found.' }
  }

  const startTime = opts.startTime || 0
  const duration = Math.max(1, (opts.endTime || 10) - startTime)

  // Configure high-quality render dimensions based on aspect ratio
  const aspectRatio = opts.aspectRatio || '9:16'
  let outW = 1080
  let outH = 1920
  let ratioW = 9
  let ratioH = 16

  if (aspectRatio === '16:9') {
    outW = 1920
    outH = 1080
    ratioW = 16
    ratioH = 9
  } else if (aspectRatio === '1:1') {
    outW = 1080
    outH = 1080
    ratioW = 1
    ratioH = 1
  }

  // Zoom scale factor (defaults to 1.0 if not provided)
  const zoom = Math.max(0.5, Math.min(5.0, Number(opts.zoomScale) || 1.0))

  const args = [
    '-ss', String(startTime),
    '-t', String(duration),
    '-i', opts.inputPath || opts.sourceUrl,
  ]

  if (opts.mode === 'blur') {
    // Blurred side padding with centered zoomed foreground
    const fgW = Math.round(outW * zoom / 2) * 2
    const fgH = Math.round(outH * zoom / 2) * 2
    args.push(
      '-filter_complex',
      `[0:v]scale=${outW}:${outH}:force_original_aspect_ratio=increase,crop=${outW}:${outH},boxblur=20:5[bg];[0:v]scale=${fgW}:${fgH}:force_original_aspect_ratio=decrease,crop=min(iw\\,${outW}):min(ih\\,${outH})[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1`,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '20',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-y',
      outPath
    )
  } else {
    // Sharp Center Crop with zoom to target ratio
    args.push(
      '-vf',
      `crop=w='trunc(min(iw,ih*${ratioW}/${ratioH})/${zoom}/2)*2':h='trunc(min(ih,iw*${ratioH}/${ratioW})/${zoom}/2)*2':x='(iw-ow)/2':y='(ih-oh)/2',scale=${outW}:${outH},setsar=1`,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '20',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-y',
      outPath
    )
  }

  const proc = spawn(ffmpegPath, args, { windowsHide: true })
  activeProcesses.set(id, proc)

  proc.stderr.on('data', (chunk) => {
    const text = chunk.toString()
    const timeMatch = text.match(/time=([\d:.]+)/)
    if (timeMatch && timeMatch[1]) {
      const parts = timeMatch[1].split(':')
      let seconds = 0
      if (parts.length === 3) {
        seconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2])
      }
      const percent = Math.min(99, Math.round((seconds / duration) * 100))
      event.sender.send('native-render-progress', { id, percent, status: `Rendering 9:16 clip: ${percent}%` })
    }
  })

  return new Promise((resolve) => {
    proc.on('close', (code) => {
      activeProcesses.delete(id)
      if (code === 0 && fs.existsSync(outPath)) {
        event.sender.send('native-render-progress', { id, percent: 100, status: 'Rendering complete!' })
        resolve({ success: true, filePath: outPath })
      } else {
        resolve({ success: false, error: `FFmpeg exited with code ${code}` })
      }
    })
  })
})

// 6. Free Subtitles & Timestamp Extraction for Auto-Clips (Opus Style)
ipcMain.handle('native-extract-subtitles', async (event, url) => {
  const ytDlpPath = getBinPath('yt-dlp.exe')
  const tempDir = app.getPath('temp')
  const tempBase = path.join(tempDir, `subs_${Date.now()}`)

  return new Promise((resolve) => {
    const args = [
      '--skip-download',
      '--write-auto-subs',
      '--write-subs',
      '--sub-langs', 'en.*,auto',
      '--sub-format', 'vtt',
      '-o', `${tempBase}.%(ext)s`,
      url,
    ]

    const proc = spawn(ytDlpPath, args, { windowsHide: true })
    proc.on('close', (code) => {
      // Look for generated .vtt file
      const files = fs.existsSync(tempDir) ? fs.readdirSync(tempDir) : []
      const matchFile = files.find(f => f.startsWith(path.basename(tempBase)) && f.endsWith('.vtt'))

      if (matchFile) {
        const fullVttPath = path.join(tempDir, matchFile)
        try {
          const content = fs.readFileSync(fullVttPath, 'utf-8')
          // Parse basic VTT cue timestamps
          const cues = []
          const cueBlocks = content.split(/\r?\n\r?\n/)
          for (const block of cueBlocks) {
            const timeMatch = block.match(/(\d{2}:\d{2}(?::\d{2})?(?:\.\d{3})?)\s*-->\s*(\d{2}:\d{2}(?::\d{2})?(?:\.\d{3})?)/)
            if (timeMatch) {
              const textLines = block.split(/\r?\n/).filter(l => !l.includes('-->') && !l.startsWith('WEBVTT') && l.trim())
              cues.push({
                startStr: timeMatch[1],
                endStr: timeMatch[2],
                text: textLines.join(' ').replace(/<[^>]+>/g, '').trim(),
              })
            }
          }
          // Clean up temp file
          try { fs.unlinkSync(fullVttPath) } catch { /* ignore */ }
          resolve({ success: true, cues })
          return
        } catch (e) {
          resolve({ success: false, error: e.message })
          return
        }
      }
      resolve({ success: false, error: 'No subtitles available for this media.' })
    })
  })
})

// IPC handler to open downloads in user's default browser (Chrome, Brave, Edge)
ipcMain.on('open-external', (event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url)
  }
})

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 860,
    minWidth: 480,
    minHeight: 640,
    title: 'A2Z Downloader - Universal Media Downloader & Studio',
    icon: path.join(__dirname, 'public', 'logo-icon.jpg'),
    backgroundColor: '#09090b',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
      preload: path.join(__dirname, 'electron-preload.js'),
    },
  })

  // Remove default menu for sleek app look
  Menu.setApplicationMenu(null)

  // Smart startup URL: automatically detect local dev server on localhost:3000 if running, else load cloud URL
  const http = require('http')
  const probeLocalhost = new Promise(resolve => {
    if (process.env.ELECTRON_START_URL) {
      return resolve(process.env.ELECTRON_START_URL)
    }
    const req = http.get('http://127.0.0.1:3000', () => {
      resolve('http://localhost:3000')
    })
    req.on('error', () => {
      resolve('https://a2zdownloader.vercel.app')
    })
    req.setTimeout(800, () => {
      req.destroy()
      resolve('https://a2zdownloader.vercel.app')
    })
  })

  probeLocalhost.then(startUrl => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const urlWithParam = startUrl.includes('?') ? `${startUrl}&platform=windows` : `${startUrl}?platform=windows`
      console.log(`[A2Z Desktop] Loading interface from: ${urlWithParam}`)
      const customUA = (mainWindow.webContents.getUserAgent() || '') + ' A2ZDesktopApp/2.0.0 Electron'
      mainWindow.webContents.setUserAgent(customUA)
      mainWindow.loadURL(urlWithParam)
    }
  })

  // Open external links (like ads, source links) in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
