const { contextBridge, ipcRenderer } = require('electron')

// Expose safe desktop environment flags and external browser launcher
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  openExternal: (url) => ipcRenderer.send('open-external', url),
})
