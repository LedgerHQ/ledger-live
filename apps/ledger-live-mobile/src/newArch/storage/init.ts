import { STORAGE_TYPE } from "./constants";
import type { StorageState } from "./types";

/**
 * Initializes the storage state reference.
 *
 * @param state
 * The storage state to initialize.
 */
export function initStorageState(state: StorageState): void {
  state.storageType = STORAGE_TYPE.ASYNC_STORAGE;
}
