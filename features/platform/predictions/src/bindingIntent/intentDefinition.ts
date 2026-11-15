import { predictionsBindingJob } from "./job";
import type { PredictionsBindingIntentDefinition } from "./types";

/** Cross-platform definition of the account binding: each app adds its component. */
export const predictionsBindingIntentDefinition: PredictionsBindingIntentDefinition = {
  label: "Predictions account binding",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: predictionsBindingJob,
};
