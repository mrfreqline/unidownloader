// Electron Main Process for A2Z Downloader Windows Desktop App (.exe)
const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn, exec } = require('child_process')
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

function getYtDlpBinary() {
  const candidates = [
    path.join(process.resourcesPath || '', 'yt-dlp.exe'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'yt-dlp.exe'),
    path.join(__dirname, 'yt-dlp.exe'),
  ]
  for (const cand of candidates) {
    if (cand && fs.existsSync(cand)) return cand
  }
  return null
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
      webSecurity: false,
      preload: path.join(__dirname, 'electron-preload.js'),
    },
  })

  // Remove default menu for clean app appearance
  Menu.setApplicationMenu(null)

  // Show immediate sleek dark loading splash screen while the local 4K engine boots
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            background-color: #09090b;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            user-select: none;
          }
          .spinner {
            width: 44px;
            height: 44px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #10b981;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          h2 { margin: 0 0 8px 0; font-size: 20px; font-weight: 700; }
          p { margin: 0; font-size: 13px; color: #a1a1aa; }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
        <h2>Starting A2Z Studio Engine</h2>
        <p>Loading native 4K YouTube processor & local render engine...</p>
      </body>
    </html>
  `))

  function getTargetAppDir() {
    if (app.isPackaged) {
      const unpackedDir = path.join(process.resourcesPath || '', 'app')
      if (fs.existsSync(unpackedDir)) return unpackedDir
      const asarDir = path.join(process.resourcesPath || '', 'app.asar')
      if (fs.existsSync(asarDir)) return asarDir
    }
    return __dirname
  }

  function startEmbeddedEngine() {
    return new Promise(resolve => {
      if (process.env.ELECTRON_START_URL) {
        return resolve(process.env.ELECTRON_START_URL)
      }

      // Check if developer server is active on localhost:3000
      const devReq = http.get('http://127.0.0.1:3000', () => {
        console.log('[A2Z Desktop] Connected to local dev server on port 3000')
        resolve('http://localhost:3000')
      })

      devReq.on('error', () => {
        // Dev server not running: boot local embedded Next.js engine!
        try {
          console.log('[A2Z Desktop] Starting embedded local Next.js engine...')
          const next = require('next')
          const targetDir = getTargetAppDir()
          const nextApp = next({ dev: false, dir: targetDir })
          const handle = nextApp.getRequestHandler()

          nextApp.prepare().then(() => {
            const server = http.createServer((sReq, sRes) => {
              handle(sReq, sRes)
            })
            server.listen(0, '127.0.0.1', () => {
              const port = server.address().port
              console.log(`[A2Z Desktop] Embedded local server listening on http://127.0.0.1:${port}`)
              resolve(`http://127.0.0.1:${port}`)
            })
            server.on('error', sErr => {
              console.warn('[A2Z Desktop] Server listen error, fallback to cloud:', sErr.message)
              resolve('https://a2zdownloader.vercel.app')
            })
          }).catch(prepErr => {
            console.warn('[A2Z Desktop] Next.js prepare failed, fallback to cloud:', prepErr.message)
            resolve('https://a2zdownloader.vercel.app')
          })
        } catch (embErr) {
          console.warn('[A2Z Desktop] Could not start embedded server:', embErr.message)
          resolve('https://a2zdownloader.vercel.app')
        }
      })

      devReq.setTimeout(600, () => {
        devReq.destroy()
      })
    })
  }

  startEmbeddedEngine().then(startUrl => {
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
// Native YouTube Inspector using bundled yt-dlp.exe
// Extracts 100% genuine 4K (2160p), 2K (1440p), 1080p, 720p streams directly on PC
// ---------------------------------------------------------
ipcMain.handle('resolve-youtube', async (event, url) => {
  const ytDlp = getYtDlpBinary()
  if (!ytDlp) {
    return { error: 'Native yt-dlp binary not found.' }
  }

  return new Promise(resolve => {
    const cmd = `"${ytDlp}" --dump-json --no-warnings --format "bv*+ba/b" "${url}"`
    exec(cmd, { maxBuffer: 50 * 1024 * 1024, timeout: 25000 }, (err, stdout) => {
      if (err || !stdout) {
        return resolve({ error: err?.message || 'Could not inspect video with yt-dlp.' })
      }

      try {
        const d = JSON.parse(stdout)
        const formats = (d.formats || []).filter(f => f.url)
        const videoOnly = formats.filter(f => f.vcodec !== 'none' && f.acodec === 'none')
        const progressive = formats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none')
        const audioOnly = formats.filter(f => f.vcodec === 'none' && f.acodec !== 'none')

        const bestAudio = audioOnly.sort((a, b) => (b.abr || 0) - (a.abr || 0))[0] || progressive[0]

        const qualities = []
        const availableFormats = []

        const has4K = videoOnly.some(f => (f.height || 0) >= 2160)
        const has2K = videoOnly.some(f => (f.height || 0) >= 1440)
        const has1080 = videoOnly.some(f => (f.height || 0) >= 1080)
        const has720 = progressive.some(f => (f.height || 0) >= 720) || videoOnly.some(f => (f.height || 0) >= 720)

        if (has4K) qualities.push('4K Ultra HD (2160p)')
        if (has2K) qualities.push('2K Quad HD (1440p)')
        if (has1080) qualities.push('1080p Full HD')
        if (has720) qualities.push('720p HD')
        qualities.push('480p Standard')
        qualities.push('360p Fast')
        qualities.push('Audio Only')

        const tiers = [
          { height: 2160, label: '4K Ultra HD (2160p)' },
          { height: 1440, label: '2K Quad HD (1440p)' },
          { height: 1080, label: '1080p Full HD' },
          { height: 720, label: '720p HD' },
          { height: 480, label: '480p Standard' },
          { height: 360, label: '360p Fast' },
        ]

        for (const tier of tiers) {
          const match = progressive.find(f => (f.height || 0) === tier.height) || videoOnly.find(f => (f.height || 0) === tier.height)
          if (match) {
            availableFormats.push({
              quality: tier.height,
              label: tier.label,
              url: match.url,
              type: 'video',
              height: tier.height,
              audioUrl: match.acodec === 'none' ? bestAudio?.url : undefined,
            })
          }
        }

        if (bestAudio) {
          availableFormats.push({
            quality: 320,
            label: 'Audio Only',
            url: bestAudio.url,
            type: 'audio',
          })
        }

        const streamableVideo = progressive[0] || videoOnly[0] || formats[0]
        const durationSec = d.duration || 0
        const m = Math.floor(durationSec / 60)
        const s = durationSec % 60
        const durationLabel = `${m}:${String(s).padStart(2, '0')}`

        resolve({
          title: d.title || 'YouTube Video',
          thumbnail: d.thumbnail || '',
          duration: durationLabel,
          durationSeconds: durationSec,
          uploader: d.uploader || 'Creator',
          platform: 'YouTube',
          qualities,
          formats: availableFormats,
          streamUrl: streamableVideo?.url,
          downloadUrl: streamableVideo?.url,
          audioUrl: bestAudio?.url,
          originalUrl: url,
          fileType: 'video',
        })
      } catch (parseErr) {
        resolve({ error: parseErr.message })
      }
    })
  })
})

// ---------------------------------------------------------
// Native Windows High-Performance Video Rendering Engine
// Renders clips up to 4K locally on user's laptop using native FFmpeg & yt-dlp
// ---------------------------------------------------------
ipcMain.handle('render-local-clip', async (event, options) => {
  const {
    inputUrl,
    origUrl,
    audioUrl,
    trimStart = 0,
    trimDuration = 60,
    aspectRatio = 'original',
    targetQuality = '1080p Full HD',
    finalFilename = 'a2z_edited_clip.mp4',
  } = options || {}

  const ffmpegBin = getFfmpegBinary()
  const ytDlpBin = getYtDlpBinary()
  const safeTitle = finalFilename.replace(/[^\w\s.-]/gi, '_')
  const savePath = path.join(app.getPath('downloads'), safeTitle)

  const is4K = targetQuality?.includes('4K') || targetQuality?.includes('2160')
  const is2K = targetQuality?.includes('2K') || targetQuality?.includes('1440')
  const maxH = is4K ? 2160 : is2K ? 1440 : 1080

  const isYouTube = (origUrl && (origUrl.includes('youtube.com') || origUrl.includes('youtu.be'))) ||
                    (inputUrl && (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')))
  const targetYtUrl = origUrl || (inputUrl.startsWith('http') && !inputUrl.includes('googlevideo.com') ? inputUrl : null)

  // Direct fast section download via yt-dlp if it's a YouTube link
  if (isYouTube && targetYtUrl && ytDlpBin) {
    return new Promise((resolve, reject) => {
      const startSec = Math.max(0, trimStart)
      const endSec = startSec + Math.max(1, trimDuration)
      const secRange = `*${startSec}-${endSec}`
      const formatStr = `bestvideo[height<=${maxH}]+bestaudio/best[height<=${maxH}]/best`

      const tempOut = path.join(app.getPath('temp'), `a2z_raw_${Date.now()}.mp4`)

      console.log(`[A2Z yt-dlp Clip] Downloading section ${secRange} from ${targetYtUrl} at ${targetQuality}...`)

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('render-progress', {
          percent: 20,
          statusText: `Fetching original ${targetQuality} stream from YouTube...`,
        })
        mainWindow.setProgressBar(0.2)
      }

      const dlArgs = [
        '--download-sections', secRange,
        '-f', formatStr,
        '--merge-output-format', 'mp4',
        '--ffmpeg-location', ffmpegBin,
        '-o', aspectRatio === 'original' || aspectRatio === '16:9' ? savePath : tempOut,
        '--no-warnings',
        targetYtUrl,
      ]

      const proc = spawn(ytDlpBin, dlArgs, { windowsHide: true })

      proc.stdout.on('data', chunk => {
        const text = chunk.toString()
        const pctMatch = text.match(/(\d+\.\d+)%/)
        if (pctMatch) {
          const dlPct = Math.min(85, Math.round(20 + parseFloat(pctMatch[1]) * 0.65))
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('render-progress', {
              percent: dlPct,
              statusText: `Downloading 4K/HD stream: ${dlPct}%...`,
            })
            mainWindow.setProgressBar(dlPct / 100)
          }
        }
      })

      proc.on('close', code => {
        if (code === 0) {
          // If aspect ratio adjustment (9:16 vertical crop) is needed, run quick FFmpeg pass
          if (aspectRatio === '9:16' && fs.existsSync(tempOut)) {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('render-progress', {
                percent: 88,
                statusText: 'Formatting video into 9:16 vertical Shorts...',
              })
            }

            const scaleW = is4K ? 2160 : 1080
            const scaleH = is4K ? 3840 : 1920
            const filter = `scale=${scaleW}:${scaleH}:force_original_aspect_ratio=decrease,pad=${scaleW}:${scaleH}:(ow-iw)/2:(oh-ih)/2:black`

            const ffArgs = [
              '-y', '-i', tempOut,
              '-vf', filter,
              '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18',
              '-c:a', 'copy',
              '-movflags', '+faststart',
              savePath,
            ]

            const ffProc = spawn(ffmpegBin, ffArgs, { windowsHide: true })
            ffProc.on('close', ffCode => {
              try { fs.unlinkSync(tempOut) } catch {}
              if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setProgressBar(-1)
              if (ffCode === 0 && fs.existsSync(savePath)) {
                shell.showItemInFolder(savePath)
                resolve({ success: true, filePath: savePath, filename: safeTitle })
              } else {
                reject(new Error(`FFmpeg framing exited with code ${ffCode}`))
              }
            })
          } else {
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setProgressBar(-1)
            if (fs.existsSync(savePath)) {
              shell.showItemInFolder(savePath)
              resolve({ success: true, filePath: savePath, filename: safeTitle })
            } else {
              reject(new Error('Output file was not generated.'))
            }
          }
        } else {
          if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setProgressBar(-1)
          reject(new Error(`yt-dlp exited with code ${code}`))
        }
      })

      proc.on('error', err => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setProgressBar(-1)
        reject(err)
      })
    })
  }

  // Fallback: Direct FFmpeg stream clipping
  if (!inputUrl) throw new Error('No input video stream provided.')

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
