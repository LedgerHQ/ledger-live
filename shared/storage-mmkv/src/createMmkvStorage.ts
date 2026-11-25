import type { ListableStoragePort } from "@shared/storage";
import { createMMKV } from "react-native-mmkv";

type MmkvStorageInput = {
  id?: string;
};

/** Runs the synchronous MMKV call at once; a call that throws rejects, as the port says. */
const asPromise = <T>(run: () => T): Promise<T> => new Promise(resolve => resolve(run()));

export function createMmkvStorage({
  id = "ledger-live",
}: MmkvStorageInput = {}): ListableStoragePort {
  const mmkv = createMMKV({ id });

  return {
    get: key =>
      asPromise(() => {
        const raw = mmkv.getString(key);
        return raw === undefined ? undefined : JSON.parse(raw);
      }),
    set: (key, value) => asPromise(() => mmkv.set(key, JSON.stringify(value))),
    remove: key =>
      asPromise(() => {
        mmkv.remove(key);
      }),
    keys: prefix => asPromise(() => mmkv.getAllKeys().filter(key => key.startsWith(prefix))),
  };
}
