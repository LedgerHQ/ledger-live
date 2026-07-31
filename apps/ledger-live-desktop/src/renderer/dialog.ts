import { ipcRenderer } from "electron";

/**
 * Single chokepoint for native file dialogs, which are run by the main process.
 *
 * Note the dialog and the subsequent file I/O are currently two separate steps: the
 * renderer receives an absolute path here and hands it back to `save-logs` /
 * `export-operations`. That split is the only place the renderer learns a real
 * filesystem path, so it is a candidate for merging into a single main-side
 * "prompt and write" operation once the context bridge lands.
 */
export const showSaveDialog = (
  options: Electron.SaveDialogOptions,
): Promise<Electron.SaveDialogReturnValue> => ipcRenderer.invoke("show-save-dialog", options);

export const showOpenDialog = (
  options: Electron.OpenDialogOptions,
): Promise<Electron.OpenDialogReturnValue> => ipcRenderer.invoke("show-open-dialog", options);
