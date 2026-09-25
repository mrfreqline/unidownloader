const { contextBridge, ipcRenderer } = require('electron')

// Expose safe, high-performance native desktop bridge to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  // Resolve YouTube media with true 4K/2K/1080p formats using local yt-dlp.exe
  resolveYouTube: (url) => ipcRenderer.invoke('resolve-youtube', url),

  // Render high-definition video clips locally using native Windows FFmpeg & yt-dlp
  renderLocalClip: (options) => ipcRenderer.invoke('render-local-clip', options),

  // Receive live real-time progress updates from local encoder
  onRenderProgress: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('render-progress', handler)
    return () => ipcRenderer.removeListener('render-progress', handler)
  },

  // Open completed download or exported video in Windows File Explorer
  openInFolder: (filePath) => ipcRenderer.invoke('open-in-folder', filePath),
})
