import { files as filesBridge } from "~/renderer/bridge";
import type { SaveOutcome } from "~/bridge/contract";

export const downloadJson = (fileName: string, contents: string): void => {
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const savePng = (
  options: Electron.SaveDialogOptions,
  base64: string,
): Promise<SaveOutcome> => filesBridge.savePng(options, base64);
