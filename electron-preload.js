const { contextBridge } = require('electron')

// Expose safe desktop environment flags
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
})
