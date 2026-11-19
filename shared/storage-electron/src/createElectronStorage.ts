import { StorageLockedError, type StoragePort } from "@shared/storage";

export type ElectronDbBridge = {
  getKey(ns: string, keyPath: string): Promise<unknown>;
  setKey(ns: string, keyPath: string, value: unknown): Promise<void>;
};

type ElectronStorageInput = {
  bridge: ElectronDbBridge;
  namespace?: "app";
  encryptedKeys?: ReadonlyArray<string>;
};

const assertKey = (key: string) => {
  if (key.length === 0) throw new RangeError("A storage key must not be empty");
};

export function createElectronStorage({
  bridge,
  namespace = "app",
  encryptedKeys = [],
}: ElectronStorageInput): StoragePort {
  const encrypted = new Set(encryptedKeys);

  return {
    async get(key) {
      assertKey(key);
      const value = await bridge.getKey(namespace, key);
      const isStillEncrypted = encrypted.has(key) && typeof value === "string";
      if (isStillEncrypted) throw new StorageLockedError(key);
      return value;
    },
    async set(key, value) {
      assertKey(key);
      await bridge.setKey(namespace, key, value);
    },
  };
}
