import { contextBridge } from "electron";

// Exposed values must be clone-safe: class instances lose their prototype under isolation.
export const expose = (key: string, api: object): void => {
  if (process.contextIsolated) {
    contextBridge.exposeInMainWorld(key, api);
  } else {
    (globalThis as unknown as Record<string, unknown>)[key] = api;
  }
};
