const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onTranscription: (callback) => {
    ipcRenderer.on('transcription', (_event, data) => {
      callback(data);
    });
  },
  chooseFile: () => ipcRenderer.invoke('show-open-dialog'),
  parseSalesScript: (filePath) => ipcRenderer.invoke('parse-sales-script', filePath),
  getEmotion: () => ipcRenderer.invoke('get-emotion'),
  onEmotionUpdate: (callback) => ipcRenderer.on('emotion-update', (_, emotion) => callback(emotion)),
  onObjectionDetected: (callback) => {
    ipcRenderer.on('objection-detected', (event, matchData) => {
      console.log('[DEBUG] Received objection match in preload:', matchData); // Log here
      callback(matchData); // Forward the matchData to React
    });
  },

});
