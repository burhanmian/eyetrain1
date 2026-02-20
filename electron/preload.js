'use strict';
/**
 * Preload script – runs in renderer process with limited Node.js access.
 * Exposes a safe API to the React app via contextBridge.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  isElectron: true
});
