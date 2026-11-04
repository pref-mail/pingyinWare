'use strict';

const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { createServer } = require('../server');

let mainWindow = null;
let httpServer = null;

app.setAppUserModelId('com.prefmail.pvzpinyin');

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(startApp).catch((err) => {
    dialog.showErrorBox('启动失败', String((err && err.stack) || err));
    app.quit();
  });

  app.on('window-all-closed', () => {
    if (httpServer) httpServer.close();
    app.quit();
  });

  app.on('before-quit', () => {
    if (httpServer) httpServer.close();
  });
}

async function startApp() {
  const appRoot = app.getAppPath();
  const dataDir = path.join(app.getPath('userData'), 'data');

  const appServer = createServer({
    publicDir: path.join(appRoot, 'public'),
    wordsFile: path.join(appRoot, 'data', 'words.json'),
    dataDir,
  });

  const wantedPort = Number(process.env.PVZ_PORT) || 0;
  const { server, port } = await appServer.start(wantedPort);
  httpServer = server;

  mainWindow = new BrowserWindow({
    width: 1120,
    height: 900,
    minWidth: 860,
    minHeight: 640,
    backgroundColor: '#0c1a10',
    autoHideMenuBar: true,
    show: false,
    title: '植物大战僵尸 · 拼音版',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.loadURL(`http://127.0.0.1:${port}/`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}
