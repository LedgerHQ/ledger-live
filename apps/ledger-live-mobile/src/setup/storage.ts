import { createMMKV } from "react-native-mmkv";
import { jsonConfigStorage, type ConfigStorage, type StorageKey } from "@shared/app-config";

// A dedicated instance, read synchronously: `LLM/storage` is async, and resetting its migration to
// MMKV deletes everything in the shared instance.
const mmkv = createMMKV({ id: "app-config" });

export const appConfigStorage: ConfigStorage = jsonConfigStorage(mmkvKey("appConfigSelections"));

function mmkvKey(key: string): StorageKey {
  return {
    get: () => mmkv.getString(key),
    set: (value: string) => mmkv.set(key, value),
    remove: () => mmkv.remove(key),
  };
}
