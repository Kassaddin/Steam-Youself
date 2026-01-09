const { contextBridge, ipcRenderer } = require('electron');
const { toJpeg, toPng, toWebp } = require('html-to-image');

contextBridge.exposeInMainWorld('steamApi', {
  saveImage: (payload) => ipcRenderer.invoke('save-image', payload),
  saveHtml: (payload) => ipcRenderer.invoke('save-html', payload),
  saveAsset: (payload) => ipcRenderer.invoke('save-asset', payload)
});

contextBridge.exposeInMainWorld('steamImage', {
  toJpeg,
  toPng,
  toWebp
});
