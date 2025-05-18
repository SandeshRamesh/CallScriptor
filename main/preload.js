const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onTranscription: (callback) => {
    ipcRenderer.on('transcription', (_event, data) => {
      callback(data);
    });
  },
  chooseFile: () => ipcRenderer.invoke('show-open-dialog'),
  parseSalesScript: (filePath) => ipcRenderer.invoke('parse-sales-script', filePath),
});
