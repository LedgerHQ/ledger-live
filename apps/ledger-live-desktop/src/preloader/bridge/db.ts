import { ipcRenderer } from "electron";
import { CHANNELS, type DbBridge, type Serializable } from "~/bridge/contract";

/**
 * The main-side handlers take a single object argument; that shape is preserved here so
 * `src/main/**` needs no changes while call sites get ordinary named arguments.
 */
export const db: DbBridge = {
  getKey: (ns: string, keyPath: string, defaultValue?: unknown) =>
    ipcRenderer.invoke(CHANNELS.getKey, { ns, keyPath, defaultValue }),

  setKey: (ns: string, keyPath: string, value: Serializable) =>
    ipcRenderer.invoke(CHANNELS.setKey, { ns, keyPath, value }),

  hasEncryptionKey: (ns: string, keyPath: string) =>
    ipcRenderer.invoke(CHANNELS.hasEncryptionKey, { ns, keyPath }),

  setEncryptionKey: (encryptionKey: string) =>
    ipcRenderer.invoke(CHANNELS.setEncryptionKey, { encryptionKey }),

  removeEncryptionKey: () => ipcRenderer.invoke(CHANNELS.removeEncryptionKey, {}),

  isEncryptionKeyCorrect: (encryptionKey: string) =>
    ipcRenderer.invoke(CHANNELS.isEncryptionKeyCorrect, { encryptionKey }),

  hasBeenDecrypted: () => ipcRenderer.invoke(CHANNELS.hasBeenDecrypted, {}),

  resetAll: () => ipcRenderer.invoke(CHANNELS.resetAll),

  reload: () => ipcRenderer.invoke(CHANNELS.reload),

  cleanCache: () => ipcRenderer.invoke(CHANNELS.cleanCache),
};
