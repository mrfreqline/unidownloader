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

  // Configure high-quality 9:16 vertical render
  const args = [
    '-ss', String(startTime),
    '-t', String(duration),
    '-i', opts.inputPath || opts.sourceUrl,
  ]

  if (opts.mode === 'blur') {
    // Blurred side padding (9:16 full-screen background with centered content)
    args.push(
      '-filter_complex',
      '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:5[bg];[0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '20',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-y',
      outPath
    )
  } else {
    // Sharp Center Crop to 9:16 vertical
    args.push(
      '-vf',
      'crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920',
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
