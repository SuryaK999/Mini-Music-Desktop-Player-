const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('serene', {
  control: (action) => ipcRenderer.send('window-ctrl', action),
  selectFiles: () => ipcRenderer.invoke('select-files'),
  getMetadata: (filePath) => ipcRenderer.invoke('get-metadata', filePath)
});