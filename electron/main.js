'use strict';
/**
 * Electron main process for MoCap Studio
 *
 * Starts the embedded Express + WebSocket server, then opens a
 * BrowserWindow.  The app works entirely offline – no internet
 * required except for the MediaPipe CDN wasm files on first run
 * (they are cached by the browser afterwards).
 *
 * Packaging produces a Windows NSIS installer and a portable .exe
 * via electron-builder.
 */

const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');
const path  = require('path');
const http  = require('http');
const isDev = !app.isPackaged;

// ── Find the server entry point ───────────────────────────────────────────
// In development: <repo>/server/index.js
// In production:  resources/server/index.js  (copied by electron-builder)
const serverEntry = isDev
  ? path.join(__dirname, '..', 'server', 'index.js')
  : path.join(process.resourcesPath, 'server', 'index.js');

const SERVER_PORT = 5000;
const WS_PORT     = 5001;

let mainWindow = null;
let serverReady = false;

// ── Start embedded server ─────────────────────────────────────────────────
function startServer() {
  return new Promise((resolve, reject) => {
    try {
      // Set env vars before requiring the server
      process.env.PORT    = String(SERVER_PORT);
      process.env.WS_PORT = String(WS_PORT);

      // Recordings go to the user's AppData/Roaming/MoCapStudio folder
      const recordingsDir = path.join(app.getPath('userData'), 'recordings');
      process.env.RECORDINGS_DIR = recordingsDir;

      require(serverEntry);
      serverReady = true;
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

// ── Wait until the local server responds ─────────────────────────────────
function waitForServer(retries = 20) {
  return new Promise((resolve, reject) => {
    const attempt = (remaining) => {
      http.get(`http://localhost:${SERVER_PORT}/api/health`, res => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry(remaining);
        }
      }).on('error', () => retry(remaining));
    };

    const retry = (remaining) => {
      if (remaining <= 0) return reject(new Error('Server did not start'));
      setTimeout(() => attempt(remaining - 1), 400);
    };

    attempt(retries);
  });
}

// ── Create browser window ─────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          820,
    minWidth:        900,
    minHeight:       600,
    title:           'MoCap Studio',
    backgroundColor: '#080818',
    icon:            path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      // Allow camera access (webcam)
      webSecurity:      false
    }
  });

  mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);

  // Open external links in the system browser instead of Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Application menu ──────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: 'MoCap Studio',
      submenu: [
        { label: 'About MoCap Studio', role: 'about' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Capture Device',
      submenu: [
        {
          label: 'Open Kinect Bridge Guide',
          click: () => {
            shell.openExternal('https://github.com/burhanmian/eyetrain1#kinect-setup-windows-only');
          }
        },
        { type: 'separator' },
        {
          label: `WebSocket Server: ws://localhost:${WS_PORT}`,
          enabled: false
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── IPC handlers ──────────────────────────────────────────────────────────
ipcMain.handle('get-app-info', () => ({
  version:      app.getVersion(),
  userData:     app.getPath('userData'),
  serverPort:   SERVER_PORT,
  wsPort:       WS_PORT,
  isDev
}));

// ── Electron lifecycle ─────────────────────────────────────────────────────
app.whenReady().then(async () => {
  buildMenu();

  try {
    await startServer();
    await waitForServer();
  } catch (err) {
    console.error('Failed to start embedded server:', err);
    // Show error and quit
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'MoCap Studio – Server Error',
      `Could not start the embedded server:\n\n${err.message}\n\nThe application will now close.`
    );
    app.quit();
    return;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Permit camera/mic access in the Electron permission handler
app.on('ready', () => {
  const { session } = require('electron');
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ['media', 'camera', 'microphone', 'display-capture'];
    callback(allowed.includes(permission));
  });
});
