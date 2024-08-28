import { catchError, from, Observable, of, switchMap, throwError } from "rxjs";
import { DeviceModelId } from "@ledgerhq/devices";
import {
  AppName,
  AppStorageType,
  DeleteAppDataError,
  DeleteAppDataEvent,
  DeleteAppDataEventType,
  StorageProvider,
} from "./types";

export function deleteAppData(
  appName: AppName,
  deviceModelId: DeviceModelId,
  storageProvider: StorageProvider<AppStorageType>,
): Observable<DeleteAppDataEvent> {
  const obs = new Observable<DeleteAppDataEvent>(subscriber => {
    subscriber.next({ type: DeleteAppDataEventType.AppDataDeleteStarted });
    const sub = from(storageProvider.getItem(`${deviceModelId}-${appName}`))
      .pipe(
        catchError(e => {
          if (e instanceof Error) {
            subscriber.error(e);
          } else {
            subscriber.error(new Error("Unknown error"));
          }
          return of(null);
        }),
        switchMap(async item => {
          if (item) {
            try {
              await storageProvider.removeItem(`${deviceModelId}-${appName}`);
              subscriber.next({ type: DeleteAppDataEventType.AppDataDeleted });
              subscriber.complete();
            } catch (e: unknown) {
              const message = e instanceof Error ? e.message : "Error deleting app data";
              throwError(() => new DeleteAppDataError(message));
            }
          } else {
            subscriber.next({ type: DeleteAppDataEventType.NoAppDataToDelete });
            subscriber.complete();
          }
        }),
      )
      .subscribe();

    return () => {
      subscriber.complete();
      sub.unsubscribe();
    };
  });

  return obs;
}
