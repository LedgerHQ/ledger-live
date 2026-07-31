import { ipcRenderer } from "electron";

export const showSaveDialog = (
  options: Electron.SaveDialogOptions,
): Promise<Electron.SaveDialogReturnValue> => ipcRenderer.invoke("show-save-dialog", options);

export const showOpenDialog = (
  options: Electron.OpenDialogOptions,
): Promise<Electron.OpenDialogReturnValue> => ipcRenderer.invoke("show-open-dialog", options);
