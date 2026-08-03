import { ipcRenderer } from "electron";

/**
 * File operations that the main process performs on the renderer's behalf.
 *
 * Each of these deliberately bundles the native dialog together with the read or write,
 * so the renderer receives file *contents* and never a filesystem path. That keeps the
 * choice of file with the user rather than with renderer code, which matters once the
 * renderer is treated as untrusted.
 */

/** Prompts for a Live App manifest and returns its contents, or null if cancelled. */
export const readLocalManifest = (): Promise<string | null> =>
  ipcRenderer.invoke("read-local-manifest");

/** Prompts for a save location and writes `contents`. Resolves false if cancelled. */
export const writeLocalManifest = (defaultName: string, contents: string): Promise<boolean> =>
  ipcRenderer.invoke("write-local-manifest", defaultName, contents);
