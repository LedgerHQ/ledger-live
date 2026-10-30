import { hyperliquidSignIntentJob } from "./job";
import type { HyperliquidSignIntentDefinition } from "./types";

/** Device app the host must open before running the intent. */
export const HYPERLIQUID_APP_NAME = "Hyperliquid";

export const hyperliquidSignIntentDefinition: HyperliquidSignIntentDefinition = {
  label: "Sign Hyperliquid actions",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: hyperliquidSignIntentJob,
};
