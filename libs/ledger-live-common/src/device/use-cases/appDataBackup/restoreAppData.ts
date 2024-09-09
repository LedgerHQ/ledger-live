import {
  AppNotFound,
  UserRefusedOnDevice,
  restoreAppStorage,
  restoreAppStorageCommit,
  restoreAppStorageInit,
} from "@ledgerhq/device-core";
import Transport from "@ledgerhq/hw-transport";
import { Observable, catchError, from, of, switchMap } from "rxjs";
import { AppName, RestoreAppDataEvent, RestoreAppDataEventType } from "./types";

/**
 * Restores the application data for a specific app on a Ledger device.
 *
 * @param transport - The transport object used to communicate with the Ledger device.
 * @param appName - The name of the application to restore.
 * @param appData - The data to restore.
 * @returns An observable that emits RestoreAppDataEvent according to the restore process.
 */
export function restoreAppData(
  transport: Transport,
  appName: AppName,
  appData: string,
): Observable<RestoreAppDataEvent> {
  const obs = new Observable<RestoreAppDataEvent>(subscriber => {
    const chunkData = Buffer.from(appData, "base64");
    const backupSize = chunkData.length;
    const sub = from(restoreAppStorageInit(transport, appName, backupSize))
      .pipe(
        switchMap(async () => {
          // Initialize the restore process
          subscriber.next({ type: RestoreAppDataEventType.AppDataInitialized });

          // Restore app data by chunks
          const MAX_CHUNK_SIZE = 255;
          let offset = 0;
          while (offset < backupSize) {
            subscriber.next({
              type: RestoreAppDataEventType.Progress,
              data: Number((offset / backupSize).toFixed(2)),
            });

            const chunkSize = Math.min(MAX_CHUNK_SIZE, backupSize - offset);
            const chunk = chunkData.subarray(offset, offset + chunkSize);

            await restoreAppStorage(transport, chunk);

            offset += chunkSize;
          }

          // Commit the restore process, last step
          await restoreAppStorageCommit(transport);

          subscriber.next({
            type: RestoreAppDataEventType.AppDataRestored,
          });
          subscriber.complete();
        }),
        catchError(e => {
          // No app data found on the app or the app does not support it
          if (e instanceof AppNotFound) {
            subscriber.next({
              type: RestoreAppDataEventType.NoAppDataToRestore,
            });
            subscriber.complete();
            return of(null);
          }

          // User refused on device
          if (e instanceof UserRefusedOnDevice) {
            // NOTE: Display a message to the user to retry the restore process
            // If he does not, we should delete the app data (in another flow)
            subscriber.next({
              type: RestoreAppDataEventType.UserRefused,
            });

            subscriber.complete();
            return of(null);
          }

          subscriber.complete();
          throw e;
        }),
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  });
  return obs;
}
