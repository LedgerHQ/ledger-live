import { files as filesBridge } from "~/renderer/bridge";

export const downloadJson = (fileName: string, contents: string): void => {
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

/** Prompts for a save location and writes the PNG. Resolves false if cancelled. */
export const savePng = (options: Electron.SaveDialogOptions, base64: string): Promise<boolean> =>
  filesBridge.savePng(options, base64);
