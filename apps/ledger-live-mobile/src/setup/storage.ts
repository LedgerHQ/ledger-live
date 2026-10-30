import { createMMKV } from "react-native-mmkv";
import { jsonConfigStorage, type AppConfigStorage, type StorageKey } from "@shared/app-config";

// A dedicated instance, read synchronously: `LLM/storage` is async, and resetting its migration to
// MMKV deletes everything in the shared instance.
const mmkv = createMMKV({ id: "app-config" });

export const appConfigStorage: AppConfigStorage = {
  selections: jsonConfigStorage(mmkvKey("appConfigSelections")),
  devValues: jsonConfigStorage(mmkvKey("appConfigDevValues")),
};

function mmkvKey(key: string): StorageKey {
  return {
    get: () => mmkv.getString(key),
    set: (value: string) => mmkv.set(key, value),
    remove: () => mmkv.remove(key),
  };
}
