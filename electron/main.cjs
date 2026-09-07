const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const isDev = !app.isPackaged;
let mainWindow;

function dataFile() {
  return path.join(app.getPath('userData'), 'shaban-data.json');
}

function readData() {
  try {
    const file = dataFile();
    if (!fs.existsSync(file)) return { version: 1, farms: [], animals: [], events: [] };
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return { version: 1, farms: [], animals: [], events: [] };
  }
}

function writeData(data) {
  fs.mkdirSync(path.dirname(dataFile()), { recursive: true });
  fs.writeFileSync(dataFile(), JSON.stringify(data, null, 2), 'utf8');
  return true;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#f5f7f6',
    title: 'شبان | سامانه هوشمند مدیریت گله',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  ipcMain.handle('shaban:version', () => app.getVersion());
  ipcMain.handle('shaban:data:read', () => readData());
  ipcMain.handle('shaban:data:write', (_event, data) => writeData(data));
  ipcMain.handle('shaban:backup', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'پشتیبان‌گیری شبان',
      defaultPath: `shaban-backup-${new Date().toISOString().slice(0,10)}.json`,
      filters: [{ name: 'Shaban Backup', extensions: ['json'] }]
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    fs.writeFileSync(result.filePath, JSON.stringify(readData(), null, 2), 'utf8');
    return { canceled: false, filePath: result.filePath };
  });
  ipcMain.handle('shaban:restore', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'بازیابی پشتیبان شبان',
      properties: ['openFile'],
      filters: [{ name: 'Shaban Backup', extensions: ['json'] }]
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const data = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
    writeData(data);
    return { canceled: false, data };
  });
  ipcMain.handle('shaban:open-external', (_event, url) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) return shell.openExternal(url);
    return false;
  });

  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
