import { ipcRenderer, webFrame } from "electron";
import { CHANNELS, type ShellBridge, type SystemBridge } from "~/bridge/contract";

export const shell: ShellBridge = {
  openExternal: (url: string) => ipcRenderer.send(CHANNELS.openExternal, url),
};

export const system: SystemBridge = {
  clipboardWriteText: (text: string) => ipcRenderer.send(CHANNELS.clipboardWriteText, text),
  clipboardReadText: () => ipcRenderer.invoke(CHANNELS.clipboardReadText),

  // webFrame is available in a sandboxed preload, so these stay synchronous.
  setVisualZoomLevelLimits: (minimum: number, maximum: number) => {
    webFrame.setVisualZoomLevelLimits(minimum, maximum);
  },
  getResourceUsage: () => webFrame.getResourceUsage(),
};
