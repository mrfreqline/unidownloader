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

  // In production or when hosted, load the app URL or local server
  const startUrl = process.env.ELECTRON_START_URL || 'https://a2zdownloader.vercel.app'
  mainWindow.loadURL(startUrl)

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
