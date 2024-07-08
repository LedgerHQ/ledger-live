import {
  StorageProvider,
  AppStorageType,
  AppStorageKey,
  appStorageTypeGuard,
  BackupAppDataError,
} from "./types";

/**
 * The storage provider for LLD.
 * Implements the StorageProvider interface.
 */
export class DesktopStorageProvider implements StorageProvider<AppStorageType> {
  /**
   * Retrieves the value associated with the specified key from the storage.
   *
   * @param key - The key to retrieve the value for, type of AppStorageKey.
   * @returns A promise that resolves to the value associated with the key, or null if the key does not exist.
   * @throws Error if the retrieved data is not of type AppStorageType.
   */
  getItem(key: AppStorageKey): Promise<AppStorageType | null> {
    const data: string | null = global.localStorage.getItem(key);
    if (!data) {
      return Promise.resolve(null);
    }
    const parsedData = JSON.parse(data);
    if (appStorageTypeGuard(parsedData)) {
      return Promise.resolve(parsedData);
    }
    throw new BackupAppDataError("Cannot parse the data.");
  }

  /**
   * Sets the stringified value associated with the specified key in the storage.
   *
   * @param key - The key to set the value for, type of AppStorageKey.
   * @param value - The stringified value of type AppStorageType.
   * @returns A promise that resolves to nothing when the value is successfully set.
   */
  setItem(key: AppStorageKey, value: AppStorageType): Promise<void> {
    const data = JSON.stringify(value);
    return Promise.resolve(global.localStorage.setItem(key, data));
  }

  /**
   * Removes the value associated with the specified key from the storage.
   *
   * @param key - The key to remove the value for.
   * @returns A promise that resolves when the value is successfully removed.
   */
  removeItem(key: AppStorageKey): Promise<void> {
    return Promise.resolve(global.localStorage.removeItem(key));
  }
}
