import { contextBridge } from "electron";

// Exposed values must be clone-safe: class instances lose their prototype under isolation.
export const expose = (key: string, api: object): void => contextBridge.exposeInMainWorld(key, api);
