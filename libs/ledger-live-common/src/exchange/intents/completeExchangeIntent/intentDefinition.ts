import { completeExchangeIntentJob } from "./job";
import type { CompleteExchangeIntentDefinition } from "./types";

export const completeExchangeIntentDefinition: CompleteExchangeIntentDefinition = {
  label: "Complete exchange",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: completeExchangeIntentJob,
};
