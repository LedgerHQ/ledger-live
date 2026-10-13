import { startExchangeIntentJob } from "./job";
import type { StartExchangeIntentDefinition } from "./types";

export const startExchangeIntentDefinition: StartExchangeIntentDefinition = {
  label: "Start exchange",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: startExchangeIntentJob,
};
