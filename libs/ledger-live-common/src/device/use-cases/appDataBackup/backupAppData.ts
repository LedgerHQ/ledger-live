import { AppStorageInfo, backupAppStorage, getAppStorageInfo } from "@ledgerhq/device-core";
import Transport from "@ledgerhq/hw-transport";
import { Observable, from, switchMap } from "rxjs";
import { AppName, BackupAppDataError, BackupAppDataEvent, BackupAppDataEventType } from "./types";

/**
 * Backs up the application data for a specific app on a Ledger device.
 * @param transport - The transport object used to communicate with the Ledger device.
 * @param appName - The name of the application to backup.
 * @returns An observable that emits BackupAppDataEvent according to the backup process.
 * @throws {BackupAppDataError}
 */
export function backupAppData(
  transport: Transport,
  appName: AppName,
): Observable<BackupAppDataEvent> {
  const obs = new Observable<BackupAppDataEvent>(subscriber => {
    const sub = from(getAppStorageInfo(transport, appName))
      .pipe(
        switchMap(async (appDataInfo: AppStorageInfo) => {
          subscriber.next({ type: BackupAppDataEventType.AppDataInfoFetched, data: appDataInfo });
          const dataSize = appDataInfo.size;

          // Check if there is any data to backup
          if (dataSize === 0) {
            subscriber.next({ type: BackupAppDataEventType.NoAppDataToBackup });
            subscriber.complete();
            return;
          }

          // Backup app data by chunks
          let appData = Buffer.from([]);
          let offset = 0;
          while (offset < dataSize) {
            const chunk: Buffer = await backupAppStorage(transport);
            // Make sure that the process advances
            if (chunk.length === 0) {
              subscriber.error(new BackupAppDataError("Chunk data is empty"));
              return;
            }
            appData = Buffer.concat([appData, chunk]);
            offset += chunk.length;
            subscriber.next({
              type: BackupAppDataEventType.Progress,
              data: Number((offset / dataSize).toFixed(2)),
            });
          }

          // Check data size
          if (appData.length !== dataSize) {
            subscriber.error(new BackupAppDataError("App data size mismatch"));
            return;
          }

          subscriber.next({
            type: BackupAppDataEventType.AppDataBackedUp,
            data: appData.toString("base64"),
          });
          subscriber.complete();
        }),
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  });
  return obs;
}
