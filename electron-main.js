// Electron Main Process for A2Z Downloader Windows Desktop App (.exe)
const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const http = require('http')

let mainWindow = null

function getFfmpegBinary() {
  const candidates = [
    path.join(process.resourcesPath || '', 'ffmpeg.exe'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.join(__dirname, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.join(__dirname, 'ffmpeg.exe'),
  ]
  for (const cand of candidates) {
    if (cand && fs.existsSync(cand)) return cand
  }
  return 'ffmpeg'
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 880,
    minWidth: 480,
    minHeight: 640,
    title: 'A2Z Downloader - Universal Media Downloader & Studio',
    icon: path.join(__dirname, 'public', 'logo-icon.jpg'),
    backgroundColor: '#09090b',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'electron-preload.js'),
    },
  })

  // Remove default menu for clean app appearance
  Menu.setApplicationMenu(null)

  // Smart startup URL: detect local dev server on localhost:3000 if running, else load production cloud
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
      console.log(`[A2Z Desktop] Loading interface from: ${startUrl}`)
      mainWindow.loadURL(startUrl)
    }
  })

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Native Windows Download Manager: downloads directly to user's Downloads folder
  mainWindow.webContents.session.on('will-download', (event, item) => {
    const defaultPath = path.join(app.getPath('downloads'), item.getFilename())
    item.setSavePath(defaultPath)

    item.on('updated', (event, state) => {
      if (state === 'progressing' && item.getTotalBytes() > 0) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setProgressBar(item.getReceivedBytes() / item.getTotalBytes())
        }
      }
    })

    item.once('done', (event, state) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setProgressBar(-1) // Reset taskbar progress
      }
      if (state === 'completed') {
        shell.showItemInFolder(item.getSavePath())
      }
    })
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ---------------------------------------------------------
// Native Windows High-Performance Video Rendering Engine
// Renders clips up to 4K locally on user's laptop (0 Vercel load)
// ---------------------------------------------------------
ipcMain.handle('render-local-clip', async (event, options) => {
  const {
    inputUrl,
    audioUrl,
    trimStart = 0,
    trimDuration = 60,
    aspectRatio = 'original',
    targetQuality = '1080p Full HD',
    finalFilename = 'a2z_edited_clip.mp4',
  } = options || {}

  if (!inputUrl) {
    throw new Error('No input video stream provided.')
  }

  const ffmpegBin = getFfmpegBinary()
  const safeTitle = finalFilename.replace(/[^\w\s.-]/gi, '_')
  const savePath = path.join(app.getPath('downloads'), safeTitle)

  const args = [
    '-y',
    '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    '-referer', 'https://www.google.com/',
    '-ss', String(Math.max(0, trimStart)),
    '-i', inputUrl,
  ]

  const hasSeparateAudio = Boolean(audioUrl && audioUrl !== inputUrl)
  if (hasSeparateAudio) {
    args.push(
      '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      '-referer', 'https://www.google.com/',
      '-ss', String(Math.max(0, trimStart)),
      '-i', audioUrl
    )
  }

  args.push('-t', String(Math.max(1, trimDuration)))

  if (hasSeparateAudio) {
    args.push('-map', '0:v:0', '-map', '1:a:0?')
  }

  const is4K = (targetQuality && (targetQuality.includes('4K') || targetQuality.includes('2160'))) || inputUrl.includes('2160')
  const scaleW = is4K ? 2160 : 1080
  const scaleH = is4K ? 3840 : 1920

  const vfFilters = []
  if (aspectRatio === '9:16') {
    vfFilters.push(`scale=${scaleW}:${scaleH}:force_original_aspect_ratio=decrease,pad=${scaleW}:${scaleH}:(ow-iw)/2:(oh-ih)/2:black`)
  } else if (aspectRatio === '16:9') {
    const w = is4K ? 3840 : 1920
    const h = is4K ? 2160 : 1080
    vfFilters.push(`scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`)
  } else if (aspectRatio === '1:1') {
    const sq = is4K ? 2160 : 1080
    vfFilters.push(`scale=${sq}:${sq}:force_original_aspect_ratio=decrease,pad=${sq}:${sq}:(ow-iw)/2:(oh-ih)/2:black`)
  }

  if (vfFilters.length > 0) {
    args.push('-vf', vfFilters.join(','))
  }

  // Universal H.264 + AAC with +faststart for 100% Windows Media Player & Phone compatibility
  args.push(
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'fastdecode',
    '-threads', '4',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-fps_mode', 'cfr',
    '-g', '60',
    '-crf', is4K ? '18' : '22',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
    '-avoid_negative_ts', 'make_zero',
    '-fflags', '+genpts',
    savePath
  )

  return new Promise((resolve, reject) => {
    console.log(`[A2Z Local Render] Launching FFmpeg with args:`, args.join(' '))

    const proc = spawn(ffmpegBin, args, { windowsHide: true })

    proc.stderr.on('data', chunk => {
      const line = chunk.toString()
      const timeMatch = line.match(/time=(\d+):(\d+):(\d+\.\d+)/)
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10)
        const mins = parseInt(timeMatch[2], 10)
        const secs = parseFloat(timeMatch[3])
        const totalSecs = hours * 3600 + mins * 60 + secs
        const pct = Math.min(99, Math.max(5, Math.round((totalSecs / trimDuration) * 100)))

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('render-progress', {
            percent: pct,
            statusText: `Encoding on your PC hardware: ${pct}%...`,
          })
          mainWindow.setProgressBar(pct / 100)
        }
      }
    })

    proc.on('close', code => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setProgressBar(-1)
      }

      if (code === 0 && fs.existsSync(savePath) && fs.statSync(savePath).size > 0) {
        shell.showItemInFolder(savePath)
        resolve({ success: true, filePath: savePath, filename: safeTitle })
      } else {
        reject(new Error(`FFmpeg encoding exited with code ${code}. Check stream link.`))
      }
    })

    proc.on('error', err => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setProgressBar(-1)
      }
      reject(err)
    })
  })
})

ipcMain.handle('open-in-folder', async (event, filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath)
    return true
  }
  return false
})

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
