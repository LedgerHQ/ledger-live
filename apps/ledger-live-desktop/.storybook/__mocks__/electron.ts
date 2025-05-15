import { fn } from "@storybook/test";
import type { Clipboard, IpcRenderer, Shell, WebFrame } from "electron";
import { apiProxy } from "./_utils";

export default apiProxy("Electron.default");

export const webFrame = apiProxy<WebFrame>("Electron.webFrame");

export const shell = apiProxy<Shell>("Electron.shell");

export const clipboard = apiProxy<Clipboard>("Electron.clipboard");

export const ipcRenderer = apiProxy<IpcRenderer>("Electron.ipcRenderer", {
  invoke: fn(() => Promise.resolve()),
});
