const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let emotionWindow;
let transcribeProcess = null; // 🔄 Keep reference to transcription process
let emotionProcess;

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

function createEmotionWindow() {
  emotionWindow = new BrowserWindow({
    width: 300,
    height: 100,
    x: 1000, // set screen position
    y: 50,
    alwaysOnTop: true,
    frame: false,
    transparent: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  emotionWindow.loadFile(path.join(__dirname, '../build/emotion.html'));
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
  createEmotionWindow();
  startEmotionStream(); // ✅ runs once

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    if (transcribeProcess) transcribeProcess.kill(); // Gracefully close
    if (emotionProcess) emotionProcess.kill();

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

ipcMain.handle('get-emotion', async () => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../speech-backend/emotion.py');

    const pythonProcess = spawn('python', [scriptPath]);

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim()); // or JSON.parse(output) if you used JSON output
      } else {
        reject(new Error(error || `Exited with code ${code}`));
      }
    });
  });
});

function startEmotionStream() {
  const scriptPath = path.join(__dirname, '../speech-backend/emotion.py');

  emotionProcess = spawn('python', [scriptPath]);

  emotionProcess.stdout.on('data', (data) => {
    const lines = data.toString().split(/\r?\n/);
    lines.forEach((line) => {
      const emotion = line.trim();
      if (!emotion || emotion.startsWith('[READY]') || emotion.startsWith('[ERROR]')) return;

      console.log('[Emotion Live]', emotion);
      if (emotionWindow) {
        emotionWindow.webContents.send('emotion-update', emotion);
      }
    });
  });

  emotionProcess.stderr.on('data', (data) => {
    console.error('[Emotion STDERR]', data.toString());
  });

  emotionProcess.on('close', (code) => {
    console.log(`[Emotion Process Exited] Code: ${code}`);
    emotionProcess = null;
  });
}