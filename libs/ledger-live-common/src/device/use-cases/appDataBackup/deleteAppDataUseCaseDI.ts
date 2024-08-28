import { Observable } from "rxjs";
import { AppName, AppStorageType, DeleteAppDataEvent, StorageProvider } from "./types";
import { DeviceModelId } from "@ledgerhq/devices";
import { deleteAppData } from "./deleteAppData";
import { deleteAppDataUseCase } from "./deleteAppDataUseCase";

export function deleteAppDataUseCaseDI(
  appName: AppName,
  deviceModelId: DeviceModelId,
  storageProvider: StorageProvider<AppStorageType>,
): Observable<DeleteAppDataEvent> {
  return deleteAppDataUseCase(appName, deviceModelId, storageProvider, () =>
    deleteAppData(appName, deviceModelId, storageProvider),
  );
}
