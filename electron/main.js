'use strict';
/**
 * Electron main process – MoCap Studio
 *
 * Embeds the Express + WebSocket server, then opens a BrowserWindow.
 * Works offline after the first MediaPipe CDN download (wasm files
 * are cached by Chromium automatically).
 *
 * Packaging strategy
 * ------------------
 * electron-builder uses asar:false so all files sit on disk, which means:
 *  - server/index.js can require() its dependencies normally
 *  - express.static / res.sendFile work without asar path issues
 *  - Python bridge is in resources/bridge/ (accessible from filesystem)
 *
 * Path layout (packaged, Windows)
 * --------------------------------
 * MoCap Studio/
 *   MoCap Studio.exe
 *   resources/
 *     app/
 *       electron/main.js   ← __dirname
 *       server/index.js
 *       client/build/
 *       node_modules/
 *     bridge/              ← Kinect Python bridge (extraResources)
 */

const { app, BrowserWindow, shell, Menu, ipcMain, dialog, session } = require('electron');
const path = require('path');
const http = require('http');

const IS_DEV      = !app.isPackaged;
const SERVER_PORT = Number(process.env.PORT    || 5000);
const WS_PORT     = Number(process.env.WS_PORT || 5001);

// ── Resolve paths that differ between dev and packaged ────────────────────
//
// In dev:      __dirname = <repo>/electron/
// In packaged: __dirname = resources/app/electron/
//
// Either way, ../server/index.js is the server entry point.
const SERVER_ENTRY = path.join(__dirname, '..', 'server', 'index.js');

// Recordings go to the OS user-data folder (persists across updates)
process.env.RECORDINGS_DIR = path.join(app.getPath('userData'), 'recordings');
process.env.PORT            = String(SERVER_PORT);
process.env.WS_PORT         = String(WS_PORT);

let mainWindow = null;

// ── Start embedded server ─────────────────────────────────────────────────
function startServer() {
  try {
    require(SERVER_ENTRY);
    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  }
}

// ── Poll until the server responds on /api/health ────────────────────────
function waitForServer(tries = 25, delay = 300) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      http.get(`http://localhost:${SERVER_PORT}/api/health`, (res) => {
        res.statusCode === 200 ? resolve() : retry(n);
      }).on('error', () => retry(n));
    };
    const retry = (n) => {
      if (n <= 0) return reject(new Error('Server did not start in time'));
      setTimeout(() => attempt(n - 1), delay);
    };
    attempt(tries);
  });
}

// ── Create main window ───────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1300,
    height:          840,
    minWidth:        900,
    minHeight:       620,
    title:           'MoCap Studio',
    backgroundColor: '#080818',
    icon:            path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      webSecurity:      false    // needed so localhost API calls work without CORS issues
    },
    show: false   // show once ready to avoid white flash
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);

  // Open all external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (IS_DEV) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Application menu ──────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Recordings Folder',
          click: () => shell.openPath(process.env.RECORDINGS_DIR)
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(IS_DEV ? [{ type: 'separator' }, { role: 'toggleDevTools' }] : [])
      ]
    },
    {
      label: 'Capture',
      submenu: [
        { label: `API Server:  http://localhost:${SERVER_PORT}`, enabled: false },
        { label: `WebSocket:   ws://localhost:${WS_PORT}`,       enabled: false },
        { type: 'separator' },
        {
          label: 'Open Kinect Bridge Guide',
          click: () => shell.openExternal(
            'https://github.com/burhanmian/eyetrain1#kinect-setup-windows-only'
          )
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About MoCap Studio',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title:   'About MoCap Studio',
              message: `MoCap Studio v${app.getVersion()}`,
              detail:
                'Motion capture from Webcam, Kinect v1, and Kinect v2.\n\n' +
                'Powered by MediaPipe Pose, Three.js, and Electron.\n\n' +
                `Server: http://localhost:${SERVER_PORT}\n` +
                `WebSocket: ws://localhost:${WS_PORT}`,
              icon: path.join(__dirname, 'icon.png')
            });
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── IPC ───────────────────────────────────────────────────────────────────
ipcMain.handle('get-app-info', () => ({
  version:    app.getVersion(),
  userData:   app.getPath('userData'),
  serverPort: SERVER_PORT,
  wsPort:     WS_PORT,
  isDev:      IS_DEV
}));

// ── Electron lifecycle ────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Grant camera/mic permissions automatically (needed for webcam capture)
  session.defaultSession.setPermissionRequestHandler((_wc, perm, cb) => {
    cb(['media', 'camera', 'microphone', 'display-capture'].includes(perm));
  });

  buildMenu();

  try {
    await startServer();
    await waitForServer();
  } catch (err) {
    dialog.showErrorBox(
      'MoCap Studio – Startup Error',
      `Failed to start the embedded server:\n\n${err.message}\n\nThe application will close.`
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
