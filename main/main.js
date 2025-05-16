const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL(
    process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../build/index.html')}`
  );

  //win.webContents.openDevTools();

  // 🧠 Start Python transcription subprocess
  startPythonBackend();
}

function startPythonBackend() {
  const pythonPath = path.join(__dirname, '../speech-backend/transcribe.py');

  const pythonProcess = spawn('python', [pythonPath]);

  // 📤 Handle output from Python
  pythonProcess.stdout.on('data', (data) => {
    const transcript = data.toString().trim();
    if (mainWindow && transcript.length > 0) {
      mainWindow.webContents.send('transcription', transcript);
    }
  });

  // 🛑 Error handling
  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Error]: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
