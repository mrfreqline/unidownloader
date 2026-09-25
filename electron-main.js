// Electron Main Process for A2Z Downloader Windows Desktop App (.exe)
const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('path')

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 860,
    minWidth: 480,
    minHeight: 640,
    title: 'A2Z Downloader - Universal Media Downloader',
    icon: path.join(__dirname, 'public', 'logo-icon.jpg'),
    backgroundColor: '#09090b',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
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
    const req = http.get('http://127.0.0.1:3000', res => {
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

  // Open external links (like ads, source links) in default browser
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
