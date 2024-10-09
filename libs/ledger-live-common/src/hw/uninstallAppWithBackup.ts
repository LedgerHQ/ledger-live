import uninstallApp from "./uninstallApp";
import type { AppStorageType, StorageProvider } from "../device/use-cases/appDataBackup/types";
import { concat, Observable } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import type { App, ApplicationVersion } from "@ledgerhq/types-live";
import { backupAppDataUseCaseDI } from "../device/use-cases/appDataBackup/backupAppDataUseCaseDI";
import { DeviceModelId } from "@ledgerhq/devices";

export default function uninstallAppWithBackup(
  transport: Transport,
  targetId: string | number,
  app: ApplicationVersion | App,
  deviceId: DeviceModelId,
  storage: StorageProvider<AppStorageType>,
  skipAppDataBackup: boolean = false,
): Observable<any> {
  const backup = backupAppDataUseCaseDI(transport, app.name, deviceId, storage);
  const uninstall = uninstallApp(transport, targetId, app);
  return skipAppDataBackup ? uninstall : concat(backup, uninstall);
}
