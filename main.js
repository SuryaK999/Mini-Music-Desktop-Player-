const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 560,
    frame: false,
    transparent: true,
    hasShadow: true,
    icon: path.join(__dirname, 'assets', 'music.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    }
  });

  win.loadFile('index.html');
  win.setMenuBarVisibility(false);
  
  // Open DevTools automatically for debugging
  win.webContents.openDevTools({ mode: 'detach' });
}

ipcMain.on('window-ctrl', (e, action) => {
  if (!win) return;
  if (action === 'close') app.quit();
  if (action === 'min') win.minimize();
});

ipcMain.handle('select-files', async () => {
  return await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio Master', extensions: ['mp3', 'wav', 'flac', 'm4a'] }]
  });
});

ipcMain.handle('get-metadata', async (e, filePath) => {
  try {
    const mm = await import('music-metadata');
    const metadata = await mm.parseFile(filePath);
    
    // Extract primary picture if available
    const picture = metadata.common.picture?.[0];
    let albumArt = null;
    if (picture && picture.data) {
      // Buffer.from is safe for both Buffer and Uint8Array returned by music-metadata
      const base64 = Buffer.from(picture.data).toString('base64');
      
      // Resolve MIME type robustly
      let format = picture.format || 'image/jpeg';
      if (format && !format.includes('/')) {
        if (format === 'jpg' || format === 'jpeg') format = 'image/jpeg';
        else if (format === 'png') format = 'image/png';
        else if (format === 'gif') format = 'image/gif';
        else format = `image/${format}`;
      }
      
      albumArt = `data:${format};base64,${base64}`;
    }
    
    return {
      title: metadata.common.title || null,
      artist: metadata.common.artist || null,
      albumArt: albumArt
    };
  } catch (err) {
    console.error('Error extracting audio metadata:', err);
    return null;
  }
});

app.whenReady().then(createWindow);