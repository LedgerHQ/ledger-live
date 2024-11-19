import Transport from "@ledgerhq/hw-transport";
import {
  AppName,
  AppStorageType,
  DeleteAppDataEvent,
  RestoreAppDataEvent,
  StorageProvider,
} from "./types";
import { Observable, switchMap } from "rxjs";
import { DeviceModelId } from "@ledgerhq/devices";
import { restoreAppDataUseCase } from "./restoreAppDataUseCase";
import { restoreAppData } from "./restoreAppData";
import { deleteAppDataUseCaseDI } from "./deleteAppDataUseCaseDI";

/**
 * Dependency injection function for the restoreAppDataUseCase.
 *
 * @param transport - The transport object used to communicate with the Ledger device.
 * @param appName - The name of the application to restore.
 * @param deviceModelId - The device model ID.
 * @param storageProvider - The storage provider object used for retrieving the backup data.
 * @returns An observable that emits RestoreAppDataEvent during the restore process.
 */
export function restoreAppDataUseCaseDI(
  transport: Transport,
  appName: AppName,
  deviceModelId: DeviceModelId,
  storageProvider: StorageProvider<AppStorageType>,
): Observable<RestoreAppDataEvent | DeleteAppDataEvent> {
  return restoreAppDataUseCase(appName, deviceModelId, storageProvider, data =>
    restoreAppData(transport, appName, data),
  ).pipe(switchMap(() => deleteAppDataUseCaseDI(appName, deviceModelId, storageProvider)));
}
