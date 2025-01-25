import { Observable } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { DeviceInfo } from "@ledgerhq/types-live";
import { listApps } from "../../apps/listApps";
import { ListAppsEvent } from "../../apps";
import { getEnv } from "@ledgerhq/live-env";
import { DeviceModelId } from "@ledgerhq/devices";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";
import { ManagerApiRepository } from "@ledgerhq/device-core";

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
