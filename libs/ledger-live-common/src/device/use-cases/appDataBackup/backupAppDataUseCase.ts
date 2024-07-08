import { Observable, Subscriber, switchMap } from "rxjs";
import {
  AppName,
  AppStorageType,
  BackupAppDataError,
  BackupAppDataEvent,
  BackupAppDataEventType,
  StorageProvider,
} from "./types";
import { AppStorageInfo } from "@ledgerhq/device-core/index";
import { DeviceModelId } from "@ledgerhq/devices";

/**
 * Backs up the application data for a specific app on a Ledger device.
 *
 * @param storageProvider - The storage provider object used for storing the backup data.
 * @param appName - The name of the application to backup.
 * @param backupAppDataFn - The function that returns the app data to backup.
 * @returns An observable that emits events during the backup process.
 * @throws {BackupAppDataError}
 */
export function backupAppDataUseCase(
  storageProvider: StorageProvider<AppStorageType>,
  appName: AppName,
  deviceModelId: DeviceModelId,
  backupAppDataFn: () => Observable<BackupAppDataEvent>,
): Observable<BackupAppDataEvent> {
  let appDataInfo: AppStorageInfo;
  const obs: Observable<BackupAppDataEvent> = backupAppDataFn().pipe(
    switchMap(async (event: BackupAppDataEvent): Promise<BackupAppDataEvent> => {
      switch (event.type) {
        case BackupAppDataEventType.AppDataInfoFetched:
          const appStorage = await storageProvider.getItem(`${deviceModelId}-${appName}`);
          // Check if the app data is already backed up
          if (appStorage && appStorage.appDataInfo?.hash === event.data.hash) {
            /**
             * We cannot get the observer's complete callback here, so need to execute it manually if needed
             */
            return { type: BackupAppDataEventType.AppDataAlreadyBackedUp };
          }
          // If not, store the app data info and transfer the event
          appDataInfo = event.data;
          return event;
        case BackupAppDataEventType.AppDataBackedUp:
          // Store the app data
          await storageProvider.setItem(`${deviceModelId}-${appName}`, {
            appDataInfo,
            appData: event.data,
          });
          // Erase the app data, then return the event
          return { type: BackupAppDataEventType.AppDataBackedUp, data: "" };
        case BackupAppDataEventType.Progress:
        case BackupAppDataEventType.NoAppDataToBackup:
          return event;
        default:
          throw new BackupAppDataError("Invalid event type.");
      }
    }),
  );
  return obs;
}
