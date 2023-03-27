import { ipcRenderer, contextBridge } from "electron";
contextBridge.exposeInMainWorld("ElectronWebview", {
  postMessage: (message: any) => ipcRenderer.sendToHost("webviewToParent", message),
});
