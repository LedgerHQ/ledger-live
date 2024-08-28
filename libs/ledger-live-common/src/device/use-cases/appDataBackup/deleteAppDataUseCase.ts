import { from, Observable } from "rxjs";
import { AppName, AppStorageType, DeleteAppDataEvent, StorageProvider } from "./types";
import { DeviceModelId } from "@ledgerhq/devices";

/**
 * Delete the local app data for a specific app on a Ledger device.
 *
 * @param appName name of the app to delete data for
 * @param deviceModelId model id of the device
 * @param storageProvider storage provider object used for storing the backup data
 * @param deleteAppDataFn function that returns observable for the delete process
 * @returns Observable<DeleteAppDataEvent>
 */
export function deleteAppDataUseCase(
  appName: AppName,
  deviceModelId: DeviceModelId,
  storageProvider: StorageProvider<AppStorageType>,
  deleteAppDataFn: () => Observable<DeleteAppDataEvent>,
) {
  const obs: Observable<DeleteAppDataEvent> = from(deleteAppDataFn());
  return obs;
}
