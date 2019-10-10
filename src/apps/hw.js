// @flow

import Transport from "@ledgerhq/hw-transport";
import type { Exec, AppOp } from "./types";
import type { ApplicationVersion } from "../types/manager";
import installApp from "../hw/installApp";
import uninstallApp from "../hw/uninstallApp";

export const execWithTransport = (transport: Transport<*>): Exec => (
  appOp: AppOp,
  targetId: string | number,
  app: ApplicationVersion
) => {
  const fn = appOp.type === "install" ? installApp : uninstallApp;
  return fn(transport, targetId, app);
};
