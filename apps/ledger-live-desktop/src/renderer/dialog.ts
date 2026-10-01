import { ipcRenderer } from "electron";

export const showSaveDialog = (
  options: Electron.SaveDialogOptions,
): Promise<Electron.SaveDialogReturnValue> => ipcRenderer.invoke("show-save-dialog", options);
