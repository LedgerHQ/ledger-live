import Transport from "@ledgerhq/hw-transport";
import { getEnv } from "../env";
import { AppOp, Exec } from "./types";
import { App } from "@ledgerhq/types-live";
import installApp from "../hw/installApp";
import uninstallApp from "../hw/uninstallApp";
import listAppsV1 from "./listApps/v1";
import listAppsV2 from "./listApps/v2";

export const execWithTransport =
  (transport: Transport): Exec =>
  (appOp: AppOp, targetId: string | number, app: App) => {
    const fn = appOp.type === "install" ? installApp : uninstallApp;
    return fn(transport, targetId, app);
  };

export const listApps = getEnv("LIST_APPS_V2") ? listAppsV2 : listAppsV1;
