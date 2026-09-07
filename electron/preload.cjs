const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shabanDesktop', {
  isDesktop: true,
  version: () => ipcRenderer.invoke('shaban:version'),
  readData: () => ipcRenderer.invoke('shaban:data:read'),
  writeData: (data) => ipcRenderer.invoke('shaban:data:write', data),
  backup: () => ipcRenderer.invoke('shaban:backup'),
  restore: () => ipcRenderer.invoke('shaban:restore'),
  openExternal: (url) => ipcRenderer.invoke('shaban:open-external', url)
});
