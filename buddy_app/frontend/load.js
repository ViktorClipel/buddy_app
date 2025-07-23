// Arquivo: frontend/load.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startBuddy: () => ipcRenderer.send('start-buddy'),
  closeBuddy: () => ipcRenderer.send('close-buddy'),
  
  openLog: () => ipcRenderer.send('open-log'),
  openPanel: () => ipcRenderer.send('open-panel'),
  resendLastPrompt: () => ipcRenderer.send('resend-last-prompt'),
  sendPrompt: (prompt) => ipcRenderer.send('send-prompt', prompt),

  toggleInputBar: () => ipcRenderer.send('toggle-input-bar'),
  moveBuddyWindow: (delta) => ipcRenderer.send('move-buddy-window', delta),

  onStreamStart: (callback) => ipcRenderer.on('stream-start', (_event) => callback()),
  onStreamAppendChunk: (callback) => ipcRenderer.on('stream-append-chunk', (_event, chunk) => callback(chunk)),
  onStreamEnd: (callback) => ipcRenderer.on('stream-end-ui', (_event) => callback()),
  
  onFullHistory: (callback) => ipcRenderer.on('full-history', (_event, value) => callback(value)),
  onNewLogMessage: (callback) => ipcRenderer.on('new-log-message', (_event, value) => callback(value)),
  
  onBootStatusUpdate: (callback) => ipcRenderer.on('boot-status-update', (_event, value) => callback(value)),
  onBootSequenceComplete: (callback) => ipcRenderer.on('boot-sequence-complete', (_event) => callback()),
  bootContinue: () => ipcRenderer.send('boot-continue'),
});