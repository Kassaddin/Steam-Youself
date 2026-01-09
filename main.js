const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    backgroundColor: '#0b1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('save-image', async (event, { dataUrl, format }) => {
  const defaultName = `steam-yourself.${format}`;
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export image',
    defaultPath: defaultName,
    filters: [{ name: 'Images', extensions: [format] }]
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  const base64 = dataUrl.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');

  await fs.writeFile(filePath, buffer);

  return { canceled: false, filePath };
});

ipcMain.handle('save-html', async (event, { html }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export HTML',
    defaultPath: 'steam-yourself.html',
    filters: [{ name: 'HTML', extensions: ['html'] }]
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  await fs.writeFile(filePath, html, 'utf8');

  return { canceled: false, filePath };
});
