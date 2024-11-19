import installApp from "./installApp";
import type {
  AppStorageType,
  DeleteAppDataEvent,
  RestoreAppDataEvent,
  StorageProvider,
} from "../device/use-cases/appDataBackup/types";
import { concat, Observable } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import type { App, ApplicationVersion } from "@ledgerhq/types-live";
import { restoreAppDataUseCaseDI } from "../device/use-cases/appDataBackup/restoreAppDataUseCaseDI";
import { DeviceModelId } from "@ledgerhq/devices";

export default function installAppWithRestore(
  transport: Transport,
  targetId: string | number,
  app: ApplicationVersion | App,
  deviceId: DeviceModelId,
  storage: StorageProvider<AppStorageType>,
): Observable<{ progress: number } | RestoreAppDataEvent | DeleteAppDataEvent> {
  const install = installApp(transport, targetId, app);
  const restore = restoreAppDataUseCaseDI(transport, app.name, deviceId, storage);

  return concat(install, restore);
}
