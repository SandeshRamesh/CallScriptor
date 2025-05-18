const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let transcribeProcess = null; // 🔄 Keep reference to transcription process

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
    },
  });

  mainWindow.loadURL(
    process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../build/index.html')}`
  );

  // mainWindow.webContents.openDevTools(); // Enable for debugging

  // 🧠 Start transcription backend ONCE
  startTranscription();
}

function startTranscription() {
  if (transcribeProcess) return; // Prevent duplicate spawns

  const pythonPath = path.join(__dirname, '../speech-backend/transcribe.py');
  transcribeProcess = spawn('python', [pythonPath]);

  transcribeProcess.stdout.on('data', (data) => {
    const transcript = data.toString().trim();
    if (mainWindow && transcript.length > 0) {
      mainWindow.webContents.send('transcription', transcript);
    }
  });

  transcribeProcess.stderr.on('data', (data) => {
    console.error('[Transcription STDERR]:', data.toString());
  });

  transcribeProcess.on('close', (code) => {
    console.log(`Transcription process exited with code ${code}, signal: ${signal}`);
    transcribeProcess = null; // Allow restart if needed
  });

  transcribeProcess.on('error', (err) => {
  console.error('[Transcription ERROR]', err);
});

}

// 🖼 App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    if (transcribeProcess) transcribeProcess.kill(); // Gracefully close
    app.quit();
  }
});

// 📂 Open file dialog
ipcMain.handle('show-open-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
  });

  if (canceled || !filePaths.length) return null;
  return filePaths[0];
});

// 🧾 Run doc-to-lines.py — isolated from transcription
ipcMain.handle('parse-sales-script', async (event, filePath) => {
  const scriptPath = path.join(__dirname, '../speech-backend/doc-to-lines.py');

  return new Promise((resolve, reject) => {
    const py = spawn('python', [scriptPath, filePath]);

    let output = '';
    let error = '';

    py.stdout.on('data', (data) => (output += data.toString()));
    py.stderr.on('data', (data) => (error += data.toString()));

    py.on('close', (code) => {
      if (code !== 0 || error) {
        console.error('Parser STDERR:', error);
        reject(error || `Exited with code ${code}`);
      } else {
        resolve(output); // Still returns a stringified JSON
      }
    });

    py.on('error', (err) => {
      console.error('Failed to run doc parser:', err);
      reject(err);
    });
  });
});
