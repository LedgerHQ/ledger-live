import { ipcRenderer, contextBridge } from "electron";
contextBridge.exposeInMainWorld("ElectronWebview", {
  postMessage: (message: unknown) => ipcRenderer.sendToHost("webviewToParent", message),
});
