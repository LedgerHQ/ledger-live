import { ipcRenderer } from "electron";
import { onPageLoad } from "@ledgerhq/ethereum-provider";

window.ElectronWebview = {
  postMessage: (message: unknown) => ipcRenderer.sendToHost("dappToParent", message),
};

window.addEventListener("load", onPageLoad);
