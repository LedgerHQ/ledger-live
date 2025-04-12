import type { StorageType } from "./types";

/** Constants for {@link StorageType}. */
export const STORAGE_TYPE = {
  MMKV: "MMKV",
  ASYNC_STORAGE: "AsyncStorage",
} as const satisfies Record<string, StorageType>;
