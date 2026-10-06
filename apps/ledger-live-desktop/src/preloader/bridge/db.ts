import { ipcRenderer } from "electron";
import { CHANNELS, type DbBridge, type Serializable } from "~/bridge/contract";

export const db: DbBridge = {
  getKey: (ns: string, keyPath: string, defaultValue?: unknown) =>
    ipcRenderer.invoke(CHANNELS.getKey, { ns, keyPath, defaultValue }),

  setKey: (ns: string, keyPath: string, value: Serializable) =>
    ipcRenderer.invoke(CHANNELS.setKey, { ns, keyPath, value }),

  hasEncryptionKey: (ns: string, keyPath: string) =>
    ipcRenderer.invoke(CHANNELS.hasEncryptionKey, { ns, keyPath }),

  setEncryptionKey: (encryptionKey: string, currentEncryptionKey?: string) =>
    ipcRenderer.invoke(CHANNELS.setEncryptionKey, { encryptionKey, currentEncryptionKey }),

  removeEncryptionKey: (currentEncryptionKey?: string) =>
    ipcRenderer.invoke(CHANNELS.removeEncryptionKey, { currentEncryptionKey }),

  isEncryptionKeyCorrect: (encryptionKey: string) =>
    ipcRenderer.invoke(CHANNELS.isEncryptionKeyCorrect, { encryptionKey }),

  hasBeenDecrypted: () => ipcRenderer.invoke(CHANNELS.hasBeenDecrypted, {}),

  resetAll: () => ipcRenderer.invoke(CHANNELS.resetAll),

  reload: () => ipcRenderer.invoke(CHANNELS.reload),

  cleanCache: () => ipcRenderer.invoke(CHANNELS.cleanCache),
};
