import { showExchangeErrorIntentJob } from "./job";
import type { ShowExchangeErrorIntentDefinition } from "./types";

export const showExchangeErrorIntentDefinition: ShowExchangeErrorIntentDefinition = {
  label: "Show exchange error",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: showExchangeErrorIntentJob,
};
