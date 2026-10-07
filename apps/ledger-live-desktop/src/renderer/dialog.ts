import { dialogs } from "~/renderer/bridge";

export const showSaveDialog = (
  options: Electron.SaveDialogOptions,
): Promise<Electron.SaveDialogReturnValue> => dialogs.showSave(options);
