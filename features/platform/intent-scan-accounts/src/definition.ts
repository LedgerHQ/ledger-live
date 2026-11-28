import { scanAccountsIntentJob } from "./job";
import type { ScanAccountsIntentDefinition } from "./types";

export function createScanAccountsIntentDefinition<Item>(): ScanAccountsIntentDefinition<Item> {
  return {
    label: "Scan accounts",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: true,
    job: scanAccountsIntentJob,
  };
}
