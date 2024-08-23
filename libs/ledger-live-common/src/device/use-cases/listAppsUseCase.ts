import { Observable } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { DeviceInfo } from "@ledgerhq/types-live";
import { listApps } from "../../apps/listApps";
import { Exec, ListAppsEvent } from "../../apps";
import { getEnv } from "@ledgerhq/live-env";
import { DeviceModelId } from "@ledgerhq/devices";
import installApp from "../../hw/installApp";
import installAppWithRestore from "../../hw/installAppWithRestore";
import uninstallApp from "../../hw/uninstallApp";
import uninstallAppWithBackup from "../../hw/uninstallAppWithBackup";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";
import { ManagerApiRepository } from "@ledgerhq/device-core";

export const execWithTransport =
  (transport: Transport, appsBackupEnabled: boolean = false): Exec =>
  args => {
    const { appOp, targetId, app, modelId, storage } = args;

    // if appsBackupEnabled is true, we will use the backup/restore flow
    // modelId & storage are required for the new flow, but can still be
    // undefined for the old flow, so we need to check if they are defined
    if (appsBackupEnabled && modelId && storage) {
      const fn = appOp.type === "install" ? installAppWithRestore : uninstallAppWithBackup;
      return fn(transport, targetId, app, modelId, storage);
    }

    const fn = appOp.type === "install" ? installApp : uninstallApp;
    return fn(transport, targetId, app);
  };
export function listAppsUseCase(
  transport: Transport,
  deviceInfo: DeviceInfo,
  managerApiRepository: ManagerApiRepository = HttpManagerApiRepositoryFactory.getInstance(),
): Observable<ListAppsEvent> {
  return listApps({
    transport,
    deviceInfo,
    deviceProxyModel: getEnv("DEVICE_PROXY_MODEL") as DeviceModelId,
    managerApiRepository,
    forceProvider: getEnv("FORCE_PROVIDER"),
    managerDevModeEnabled: getEnv("MANAGER_DEV_MODE"),
  });
}
