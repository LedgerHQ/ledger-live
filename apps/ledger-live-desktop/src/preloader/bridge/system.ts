import { ipcRenderer, webFrame } from "electron";
import { CHANNELS, type ShellBridge, type SystemBridge } from "~/bridge/contract";

export const shell: ShellBridge = {
  // Main validates the URL, so the check happens on the trusted side.
  openExternal: (url: string) => ipcRenderer.send(CHANNELS.openExternal, url),
};

export const system: SystemBridge = {
  clipboardWriteText: (text: string) => ipcRenderer.send(CHANNELS.clipboardWriteText, text),
  clipboardReadText: () => ipcRenderer.invoke(CHANNELS.clipboardReadText),

  // webFrame is one of the few Electron modules a sandboxed preload can still require, so
  // these stay synchronous.
  setVisualZoomLevelLimits: (minimum: number, maximum: number) => {
    webFrame.setVisualZoomLevelLimits(minimum, maximum);
  },
  getResourceUsage: () => webFrame.getResourceUsage(),
};
