const { contextBridge, ipcRenderer } = require('electron')

// Expose safe, high-performance native desktop bridge to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  
  // Render high-definition video clips locally using native Windows FFmpeg
  renderLocalClip: (options) => ipcRenderer.invoke('render-local-clip', options),
  
  // Receive live real-time progress updates from local FFmpeg encoder
  onRenderProgress: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('render-progress', handler)
    return () => ipcRenderer.removeListener('render-progress', handler)
  },
  
  // Open completed download or exported video in Windows File Explorer
  openInFolder: (filePath) => ipcRenderer.invoke('open-in-folder', filePath),
})
