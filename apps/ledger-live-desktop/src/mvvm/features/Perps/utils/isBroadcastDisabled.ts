import { getEnv } from "@shared/env";

/** The app's effective setting, shared with every other broadcast path. */
export function isBroadcastDisabled(): boolean {
  return getEnv("DISABLE_TRANSACTION_BROADCAST");
}
