import { contextBridge } from "electron";

/**
 * Publishes an object from the preload's world into the renderer's. Everything must be
 * clone-safe: a class instance silently loses its prototype rather than throwing, so the
 * failure surfaces as a missing method at some call site instead of at the boundary.
 */
export const expose = (key: string, api: object): void => contextBridge.exposeInMainWorld(key, api);
