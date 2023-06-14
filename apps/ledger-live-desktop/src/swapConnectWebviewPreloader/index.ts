import { ipcRenderer, contextBridge } from "electron";
const postMessage = (message: string) => ipcRenderer.sendToHost("webviewToParent", message);
contextBridge.exposeInMainWorld("ledger", {
  setToken: (token: string) => {
    const message = JSON.stringify({
      type: "setToken",
      token,
    });
    postMessage(message);
  },
  closeWidget: () => {
    const message = JSON.stringify({
      type: "closeWidget",
    });
    postMessage(message);
  },
});
