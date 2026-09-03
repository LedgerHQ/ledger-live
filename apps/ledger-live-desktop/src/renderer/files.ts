import { files as filesBridge } from "~/renderer/bridge";
import type { SaveOutcome } from "~/bridge/contract";

/**
 * File operations the main process performs on the renderer's behalf.
 *
 * Each bundles the native dialog together with the read or write, so the renderer receives
 * file *contents* and never a path it could reuse — the choice of file stays with the user.
 */

export const readLocalManifest = (): Promise<string | null> => filesBridge.readLocalManifest();

/** Resolves false when the user cancels the dialog. */
export const writeLocalManifest = (defaultName: string, contents: string): Promise<boolean> =>
  filesBridge.writeLocalManifest(defaultName, contents);

export const savePng = (
  options: Electron.SaveDialogOptions,
  base64: string,
): Promise<SaveOutcome> => filesBridge.savePng(options, base64);
