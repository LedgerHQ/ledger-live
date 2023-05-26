import Transport from "@ledgerhq/hw-transport";
import { App, DeviceInfo } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { AppOp, Exec } from "./types";
import { getEnv } from "../env";
import installApp from "../hw/installApp";
import uninstallApp from "../hw/uninstallApp";
import type { ListAppsEvent } from "./types";

import listAppsV1 from "./listApps/v1";
import listAppsV2 from "./listApps/v2";

export const execWithTransport =
  (transport: Transport): Exec =>
  (appOp: AppOp, targetId: string | number, app: App) => {
    const fn = appOp.type === "install" ? installApp : uninstallApp;
    return fn(transport, targetId, app);
  };

/**
 * The moment we deem the v2 as stable enough and we remove this fork in our
 * logic there will be some cleanup to do too.
 * - We no longer need the polyfill dependency resolution that is based on the
 *   currency and parent application. And therefor we no longer need the version
 *   check that broke that dependency after a certain version for ETH and BTC.
 * - Remove all the legacy v1 code, and tests.
 * - Remove the env definition and all the forks based on it here.
 */
// Nb Written this way to respect runtime changes to the env.
export const listApps = (
  transport: Transport,
  deviceInfo: DeviceInfo
): Observable<ListAppsEvent> =>
  getEnv("LIST_APPS_V2")
    ? listAppsV2(transport, deviceInfo)
    : listAppsV1(transport, deviceInfo);
