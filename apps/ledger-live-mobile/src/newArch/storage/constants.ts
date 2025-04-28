import type { StorageType } from "./types";

/** Constants for {@link StorageType}. */
export const STORAGE_TYPE = {
  MMKV: "MMKV",
  ASYNC_STORAGE: "AsyncStorage",
} as const satisfies Record<string, StorageType>;

/** Max number of errors */
export const MAX_NUMBER_OF_ERRORS = 5;
