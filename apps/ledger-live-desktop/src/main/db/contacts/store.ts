import { app } from "electron";
import ElectronStore from "electron-store";

const STORAGE_KEY = "wallet";

// Lazy: defer construction until first use so the store picks up the
// runtime userData directory (after setUserDataPath() / honouring the
// LEDGER_CONFIG_DIRECTORY env var), not the default Electron dev path
// that's active at module-import time.
let store: ElectronStore | undefined;
const getStore = (): ElectronStore => {
  if (!store) {
    const cwd = process.env.LEDGER_CONFIG_DIRECTORY || app.getPath("userData");
    store = new ElectronStore({ name: "lld-contacts", cwd });
  }
  return store;
};

export function getContactsWallet<T>(): T | undefined {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return getStore().get(STORAGE_KEY) as T | undefined;
}

export function setContactsWallet<T>(value: T): void {
  getStore().set(STORAGE_KEY, value);
}

export function resetContactsWallet(): void {
  getStore().clear();
}
