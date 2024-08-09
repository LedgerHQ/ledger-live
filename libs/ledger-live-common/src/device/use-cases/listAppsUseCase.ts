import { Observable } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { DeviceInfo } from "@ledgerhq/types-live";
import { listApps } from "../../apps/listApps";
import { AppOp, Exec, ListAppsEvent } from "../../apps";
import { getEnv } from "@ledgerhq/live-env";
import { DeviceModelId } from "@ledgerhq/devices";
import { App } from "@ledgerhq/types-live";
import installApp from "../../hw/installApp";
import uninstallApp from "../../hw/uninstallApp";
import { HttpManagerApiRepositoryFactory } from "../factories/HttpManagerApiRepositoryFactory";
import { ManagerApiRepository } from "@ledgerhq/device-core";

export const execWithTransport =
  (transport: Transport): Exec =>
  (appOp: AppOp, targetId: string | number, app: App) => {
    const fn = appOp.type === "install" ? installApp : uninstallApp;
    return fn(transport, targetId, app);
  };

/**
 * The moment we deem the v2 as stable enough and we remove this fork in our
 * logic there will be some cleanup to do too.
 * Refer to https://ledgerhq.atlassian.net/browse/LIVE-7945
 * - We no longer need the polyfill dependency resolution that is based on the
 *   currency and parent application. And therefor we no longer need the version
 *   check that broke that dependency after a certain version for ETH and BTC.
 * - Remove all the legacy v1 code, and tests.
 * - Cleanup the feature flag that governs this.
 */

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
