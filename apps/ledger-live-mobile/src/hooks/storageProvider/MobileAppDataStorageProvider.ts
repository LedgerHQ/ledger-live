import {
  StorageProvider as AppDataStorageProvider,
  AppStorageType,
  AppStorageKey,
  isAppStorageType,
  BackupAppDataError,
} from "@ledgerhq/live-common/device/use-cases/appDataBackup/types";
import storage from "LLM/storage";

/**
 * The storage provider for LLM that implements the StorageProvider interface.
 * This a temporary placement, it could be moved to the appropriate location if needed.
 */
export class MobileAppDataStorageProvider implements AppDataStorageProvider<AppStorageType> {
  /**
   * Retrieves the value associated with the specified key from storage.
   *
   * @param key - The key of the value to retrieve, type of AppStorageKey.
   * @returns A promise that resolves to the retrieved value, or null if the key does not exist.
   * @throws {BackupAppDataError} If the data cannot be parsed or has an invalid data type.
   */
  async getItem(key: AppStorageKey): Promise<AppStorageType | null> {
    const data: string | null = (await storage.get(key)) as string | null;
    if (!data) {
      return null;
    }
    try {
      const parsedData = JSON.parse(data);
      if (isAppStorageType(parsedData)) {
        return parsedData;
      }
    } catch (error: unknown) {
      throw new BackupAppDataError("Cannot parse the data (SyntaxError).");
    }
    throw new BackupAppDataError("Invalid data type.");
  }

  /**
   * Sets the value associated with the specified key in storage.
   *
   * @param key - The key of the value to set, type of AppStorageKey.
   * @param value - The value to set, type of AppStorageType.
   * @returns A promise that resolves when the value has been successfully set.
   * @throws {BackupAppDataError} If the data cannot be stringified.
   */
  async setItem(key: AppStorageKey, value: AppStorageType): Promise<void> {
    try {
      const data = JSON.stringify(value);
      await storage.save(key, data);
    } catch (error: unknown) {
      throw new BackupAppDataError("Cannot stringify the data (TypeError).");
    }
  }

  /**
   * Removes the value associated with the specified key from storage.
   *
   * @param key - The key of the value to remove, type of AppStorageKey.
   * @returns A promise that resolves when the value has been successfully removed.
   */
  async removeItem(key: AppStorageKey): Promise<void> {
    await storage.delete(key);
  }
}
