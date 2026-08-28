import { ipcRenderer } from "electron";
import {
  CHANNELS,
  type AppBridge,
  type DialogsBridge,
  type FilesBridge,
  type PowerBridge,
  type SaveTarget,
  type StoreBridge,
} from "~/bridge/contract";

export const app: AppBridge = {
  reload: () => ipcRenderer.send(CHANNELS.appReload),
  relaunch: () => ipcRenderer.send(CHANNELS.appRelaunch),
  quit: () => ipcRenderer.send(CHANNELS.appQuit),
  show: () => ipcRenderer.send(CHANNELS.showApp, {}),
};

export const dialogs: DialogsBridge = {
  showSave: (options: Electron.SaveDialogOptions) =>
    ipcRenderer.invoke(CHANNELS.showSaveDialog, options),
};

export const files: FilesBridge = {
  saveLogs: (target: SaveTarget, logsJson: string) =>
    ipcRenderer.invoke(CHANNELS.saveLogs, target, logsJson),
  exportOperations: (target: SaveTarget, csv: string) =>
    ipcRenderer.invoke(CHANNELS.exportOperations, target, csv),
  savePng: (options: Electron.SaveDialogOptions, base64: string) =>
    ipcRenderer.invoke(CHANNELS.savePng, options, base64),
  openUserDataDirectory: () => ipcRenderer.invoke(CHANNELS.openUserDataDirectory),
};

export const power: PowerBridge = {
  keepScreenAwake: () => ipcRenderer.invoke(CHANNELS.keepScreenAwake),
  release: (blockerId?: number) => ipcRenderer.invoke(CHANNELS.releaseScreenAwake, blockerId),
};

export const store: StoreBridge = {
  set: (key: string, value: unknown) => ipcRenderer.send(CHANNELS.storeSet, key, value),
  clear: () => ipcRenderer.send(CHANNELS.storeClear),
};
