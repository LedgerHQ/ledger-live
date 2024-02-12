import Transport from "@ledgerhq/hw-transport";
import { App, DeviceInfo } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { AppOp, Exec } from "./types";
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
 * Refer to https://ledgerhq.atlassian.net/browse/LIVE-7945
 * - We no longer need the polyfill dependency resolution that is based on the
 *   currency and parent application. And therefor we no longer need the version
 *   check that broke that dependency after a certain version for ETH and BTC.
 * - Remove all the legacy v1 code, and tests.
 * - Cleanup the feature flag that governs this.
 */
let listAppsV2Enabled = false;
export const enableListAppsV2 = (enabled: boolean) => (listAppsV2Enabled = enabled);
export const listApps = (
  transport: Transport,
  deviceInfo: DeviceInfo,
): Observable<ListAppsEvent> =>
  listAppsV2Enabled ? listAppsV2(transport, deviceInfo) : listAppsV1(transport, deviceInfo);
