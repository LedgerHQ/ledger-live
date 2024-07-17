import { type AppStorageInfo, appStorageInfoGuard } from "@ledgerhq/device-core";
import { DeviceModelId } from "@ledgerhq/devices";
import { createCustomErrorClass } from "@ledgerhq/errors";

export interface StorageProvider<VType> {
  getItem(key: string): Promise<VType | null>;
  setItem(key: string, value: VType): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type AppName = string;
export type AppStorageKey =
  `${Exclude<DeviceModelId, DeviceModelId.blue | DeviceModelId.nanoS>}-${AppName}`;

export type AppStorageType = {
  appDataInfo: AppStorageInfo;
  appData: string;
};

export function appStorageTypeGuard(data: AppStorageType | unknown): data is AppStorageType {
  return (
    typeof data === "object" &&
    data !== null &&
    "appDataInfo" in data &&
    appStorageInfoGuard(data.appDataInfo) &&
    "appData" in data &&
    typeof data.appData === "string"
  );
}

export enum BackupAppDataEventType {
  Progress = "progress",
  AppDataInfoFetched = "appDataInfoFetched",
  AppDataBackedUp = "appDataBackedUp",
  AppDataAlreadyBackedUp = "appDataAlreadyBackedUp",
  NoAppDataToBackup = "noAppDataToBackup",
}

export type BackupAppDataEvent =
  | {
      type: BackupAppDataEventType.Progress;
      data: number; // Progress percentage
    }
  | {
      type: BackupAppDataEventType.AppDataInfoFetched;
      data: AppStorageInfo;
    }
  | {
      type: BackupAppDataEventType.AppDataBackedUp;
      data: string; // Base64 encoded app data or empty string
    }
  | {
      type: BackupAppDataEventType.AppDataAlreadyBackedUp; // Go to next app backup or finish
    }
  | {
      type: BackupAppDataEventType.NoAppDataToBackup; // Go to next app backup or finish
    };

export const BackupAppDataError = createCustomErrorClass("BackupAppDataError");
