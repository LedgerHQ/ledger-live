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

// Nb Written this way to respect runtime changes to the env.
export const listApps = (
  transport: Transport,
  deviceInfo: DeviceInfo
): Observable<ListAppsEvent> =>
  getEnv("LIST_APPS_V2")
    ? listAppsV2(transport, deviceInfo)
    : listAppsV1(transport, deviceInfo);
