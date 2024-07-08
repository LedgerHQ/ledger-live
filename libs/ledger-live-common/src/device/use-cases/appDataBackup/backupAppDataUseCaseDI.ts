import Transport from "@ledgerhq/hw-transport";
import { backupAppData } from "./backupAppData";
import { backupAppDataUseCase } from "./backupAppDataUseCase";
import { AppName, AppStorageType, BackupAppDataEvent, StorageProvider } from "./types";
import { Observable } from "rxjs";
import { DeviceModelId } from "@ledgerhq/devices";

/**
 * Dependency injection function for the backupAppDataUseCase.
 *
 * @param transport - The hardware transport object used for communication with the device.
 * @param storageProvider - The storage provider object used for storing the backup data.
 * @param appName - The name of the application for which the data needs to be backed up.
 * @returns The backupAppDataUseCase with the provided dependencies injected.
 */
export function backupAppDataUseCaseDI(
  transport: Transport,
  storageProvider: StorageProvider<AppStorageType>,
  deviceModelId: DeviceModelId,
  appName: AppName,
): Observable<BackupAppDataEvent> {
  return backupAppDataUseCase(storageProvider, appName, deviceModelId, () =>
    backupAppData(transport, appName),
  );
}
