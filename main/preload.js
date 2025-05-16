const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onTranscription: (callback) => {
    ipcRenderer.on('transcription', (_event, data) => {
      callback(data);
    });
  }
});
