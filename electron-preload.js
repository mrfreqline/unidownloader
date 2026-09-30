const { contextBridge, ipcRenderer } = require('electron')

// Expose safe desktop environment flags and Native Engine APIs
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  openExternal: (url) => ipcRenderer.send('open-external', url),

  // Native Engine APIs (yt-dlp + ffmpeg)
  getEngineStatus: () => ipcRenderer.invoke('native-engine-status'),
  startNativeDownload: (opts) => ipcRenderer.invoke('native-download-start', opts),
  cancelNativeDownload: (id) => ipcRenderer.invoke('native-download-cancel', id),
  openFolder: (filePath) => ipcRenderer.invoke('native-open-folder', filePath),
  renderClip: (opts) => ipcRenderer.invoke('native-render-clip', opts),
  extractSubtitles: (url) => ipcRenderer.invoke('native-extract-subtitles', url),

  // Event Listeners with safe cleanup
  onDownloadProgress: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on('native-download-progress', listener)
    return () => ipcRenderer.removeListener('native-download-progress', listener)
  },
  onDownloadComplete: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on('native-download-complete', listener)
    return () => ipcRenderer.removeListener('native-download-complete', listener)
  },
  onRenderProgress: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on('native-render-progress', listener)
    return () => ipcRenderer.removeListener('native-render-progress', listener)
  },
})
