import { from, Observable, of, switchMap } from "rxjs";
import {
  AppName,
  AppStorageType,
  RestoreAppDataEvent,
  RestoreAppDataEventType,
  StorageProvider,
} from "./types";
import { DeviceModelId } from "@ledgerhq/devices";

/**
 * Restores the application data for a specific app on a Ledger device.
 *
 * @param appName - The name of the application to restore.
 * @param deviceModelId - The device model ID.
 * @param storageProvider - The storage provider object used for retrieving the backup data.
 * @param restoreAppDataFn - The function used to restore the app data.
 * @returns An observable that emits RestoreAppDataEvent according to the restore process.
 * @throws {RestoreAppDataError}
 */
export function restoreAppDataUseCase(
  appName: AppName,
  deviceModelId: DeviceModelId,
  storageProvider: StorageProvider<AppStorageType>,
  restoreAppDataFn: (data: string) => Observable<RestoreAppDataEvent>,
): Observable<RestoreAppDataEvent> {
  const obs: Observable<RestoreAppDataEvent> = from(
    storageProvider.getItem(`${deviceModelId}-${appName}`),
  ).pipe(
    switchMap((appStorage: AppStorageType | null) => {
      if (!appStorage) {
        return of<RestoreAppDataEvent>({
          type: RestoreAppDataEventType.NoAppDataToRestore,
        });
      }
      return restoreAppDataFn(appStorage.appData);
    }),
  );
  return obs;
}
