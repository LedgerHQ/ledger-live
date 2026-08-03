import { contextBridge } from "electron";

/**
 * Publishes an object to the renderer's world, working both before and after
 * `contextIsolation` is enabled.
 *
 * This is what lets the bridge and every call-site migration ship against the app as it
 * runs today: with isolation off the object is assigned straight onto the shared global,
 * and with it on the same object goes through `contextBridge`. Call sites behave
 * identically either way, so turning the flag on becomes a small, revertible change rather
 * than a big-bang cutover.
 *
 * `process.contextIsolated` is available in the preload in both modes. We branch on it
 * explicitly rather than relying on `exposeInMainWorld` happening to tolerate isolation
 * being off, which is version-dependent behaviour.
 *
 * The consequence is that anything published here must already be clone-safe: plain
 * objects, primitives and functions only. Class instances silently lose their prototype
 * rather than throwing, so a mistake here would surface only after the flag flips.
 */
export const expose = (key: string, api: object): void => {
  if (process.contextIsolated) {
    contextBridge.exposeInMainWorld(key, api);
  } else {
    (globalThis as unknown as Record<string, unknown>)[key] = api;
  }
};
