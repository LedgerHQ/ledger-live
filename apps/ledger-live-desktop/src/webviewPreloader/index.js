import { ipcRenderer, contextBridge } from "electron";
contextBridge.exposeInMainWorld("ElectronWebview", {
  postMessage: message => ipcRenderer.sendToHost("webviewToParent", message),
});
