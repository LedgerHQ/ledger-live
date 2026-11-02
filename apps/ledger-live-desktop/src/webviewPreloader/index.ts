import { ipcRenderer, contextBridge } from "electron";
import { CHANNELS } from "~/bridge/contract";

// Goes through main, which checks the sending frame before handing the message to the embedder.
contextBridge.exposeInMainWorld("ElectronWebview", {
  postMessage: (message: unknown) =>
    ipcRenderer.send(CHANNELS.webviewBridgeMessage, "webviewToParent", message),
});
