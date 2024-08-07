import { type AppStorageInfo, isAppStorageInfo } from "@ledgerhq/device-core";
import { DeviceModelId } from "@ledgerhq/devices";
import { createCustomErrorClass } from "@ledgerhq/errors";

/**
 * The interface for the storage provider used to store the application data, should be implemented in a platform-specific context.
 */
export interface StorageProvider<VType> {
  getItem(key: string): Promise<VType | null>;
  setItem(key: string, value: VType): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type AppName = string;

/**
 * The key used to store the application data in the device storage, is a combination of the device model ID and the application name.
 */
export type AppStorageKey =
  `${Exclude<DeviceModelId, DeviceModelId.blue | DeviceModelId.nanoS>}-${AppName}`;

export type AppStorageType = {
  appDataInfo: AppStorageInfo;
  appData: string;
};

export function isAppStorageType(data: AppStorageType | unknown): data is AppStorageType {
  return (
    typeof data === "object" &&
    data !== null &&
    "appDataInfo" in data &&
    isAppStorageInfo(data.appDataInfo) &&
    "appData" in data &&
    typeof data.appData === "string"
  );
}

export enum BackupAppDataEventType {
  /**
   * The progress of the ongoing backup process.
   */
  Progress = "progress",
  /**
   * The application data information has been fetched.
   */
  AppDataInfoFetched = "appDataInfoFetched",
  /**
   * The application data has been backed up.
   */
  AppDataBackedUp = "appDataBackedUp",
  /**
   * The application data has already been backed up, no need to backup again.
   */
  AppDataAlreadyBackedUp = "appDataAlreadyBackedUp",
  /**
   * There is no application data to backup.
   */
  NoAppDataToBackup = "noAppDataToBackup",
}

export type BackupAppDataEvent =
  | {
      type: BackupAppDataEventType.Progress;
      /**
       * The progress of the backup process as a number between 0 and 1.
       */
      data: number;
    }
  | {
      type: BackupAppDataEventType.AppDataInfoFetched;
      /**
       * The application data information.
       */
      data: AppStorageInfo;
    }
  | {
      type: BackupAppDataEventType.AppDataBackedUp;
      /**
       * The base64 encoded application data or an empty string.
       */
      data: string;
    }
  | {
      type: BackupAppDataEventType.AppDataAlreadyBackedUp;
    }
  | {
      type: BackupAppDataEventType.NoAppDataToBackup;
    };

/**
 * An error that occurs during the backup process, the error message should be descriptive when thrown.
 */
export const BackupAppDataError = createCustomErrorClass("BackupAppDataError");

export enum RestoreAppDataEventType {
  /**
   * The progress of the ongoing restoring process.
   */
  Progress = "progress",
  /**
   * The application data is initialized for the restore process.
   */
  AppDataInitialized = "appDataInitialized",
  /**
   * The application data has been restored.
   */
  AppDataRestored = "appDataRestored",
}

export type RestoreAppDataEvent =
  | {
      type: RestoreAppDataEventType.Progress;
      /**
       * The progress of the restore process as a number between 0 and 1.
       */
      data: number;
    }
  | {
      type: RestoreAppDataEventType.AppDataInitialized;
    }
  | {
      type: RestoreAppDataEventType.AppDataRestored;
    };

/**
 * An error that occurs during the restore process, the error message should be descriptive when thrown.
 */
export const RestoreAppDataError = createCustomErrorClass("RestoreAppDataError");
