import {
  StorageProvider,
  AppStorageType,
  AppStorageKey,
  isAppStorageType,
  BackupAppDataError,
} from "@ledgerhq/live-common/device/use-cases/appDataBackup/types";

/**
 * The storage provider for LLD that implements the StorageProvider interface.
 * This a temporary placement for the DesktopStorageProvider, it could be moved to the appropriate location if needed.
 */
export class DesktopStorageProvider implements StorageProvider<AppStorageType> {
  /**
   * Retrieves the value associated with the specified key from the storage.
   *
   * @param key - The key to retrieve the value for, type of AppStorageKey.
   * @returns A promise that resolves to the value associated with the key, or null if the key does not exist.
   * @throws Error if the retrieved data cannot be parsed or is not of type AppStorageType.
   */
  getItem(key: AppStorageKey): Promise<AppStorageType | null> {
    const data: string | null = global.localStorage.getItem(key);
    if (!data) {
      return Promise.resolve(null);
    }
    try {
      const parsedData = JSON.parse(data);
      if (isAppStorageType(parsedData)) {
        return Promise.resolve(parsedData);
      }
    } catch (error: unknown) {
      throw new BackupAppDataError("Cannot parse the data(SyntaxError).");
    }
    throw new BackupAppDataError("Invalid data type.");
  }

  /**
   * Sets the stringified value associated with the specified key in the storage.
   *
   * @param key - The key to set the value for, type of AppStorageKey.
   * @param value - The stringified value of type AppStorageType.
   * @returns A promise that resolves to nothing when the value is successfully set.
   * @throws Error if the value cannot be stringified.
   */
  setItem(key: AppStorageKey, value: AppStorageType): Promise<void> {
    try {
      const data = JSON.stringify(value);
      return Promise.resolve(global.localStorage.setItem(key, data));
    } catch (error: unknown) {
      throw new BackupAppDataError("Cannot stringify the data(TypeError).");
    }
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
