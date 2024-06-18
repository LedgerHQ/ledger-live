import { log } from "@ledgerhq/logs";
import { getEnv } from "@ledgerhq/live-env";

export function logDrawer(
  message: string | number,
  data?: Record<string, unknown> | number | string,
) {
  if (getEnv("LOG_DRAWERS"))
    log("QueuedDrawer", typeof message === "number" ? message.toString() : message, data);
}
