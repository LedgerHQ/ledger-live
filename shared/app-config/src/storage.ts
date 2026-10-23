import type { ConfigStorage, StorageKey } from "./types";

/**
 * A storage that only reads what `read` returns, for runs that pass their selections or dev values
 * at launch, such as e2e runs. Writes do nothing, so the devtool changes nothing they boot with.
 */
export const readOnlyConfigStorage = (read: () => unknown): ConfigStorage => ({
  getAll: read,
  set() {},
  remove() {},
  clear() {},
});

/**
 * A storage holding its entries as JSON under one `key`. A write replaces unreadable entries, while
 * `getAll` stays strict, since `resolveAppConfig` clears unreadable ones at boot.
 */
export function jsonConfigStorage(key: StorageKey): ConfigStorage {
  return {
    getAll: () => JSON.parse(key.get() ?? "{}"),
    clear: () => key.remove(),
    set: (name, value) => key.set(JSON.stringify({ ...readForWrite(), [name]: value })),
    remove: name => {
      const entries = readForWrite();
      delete entries[name];
      key.set(JSON.stringify(entries));
    },
  };

  function readForWrite(): Record<string, string> {
    try {
      return JSON.parse(key.get() ?? "{}") ?? {};
    } catch {
      return {};
    }
  }
}
