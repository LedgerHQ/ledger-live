import { createMMKV } from "react-native-mmkv";
import type { ConfigStorage } from "@shared/app-config";

// A dedicated instance, read synchronously: `LLM/storage` is async, and resetting its migration to
// MMKV deletes everything in the shared instance.
const selectionsStorage = createMMKV({ id: "app-config" });

export const appConfigStorage: ConfigStorage = {
  getAll: () =>
    selectionsStorage.getAllKeys().reduce(
      (acc, key) => {
        acc[key] = selectionsStorage.getString(key);
        return acc;
      },
      {} as Record<string, string | undefined>,
    ),
  clear: () => selectionsStorage.clearAll(),
  set: (key, value) => selectionsStorage.set(key, value),
};
