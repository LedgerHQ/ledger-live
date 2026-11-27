import { predictionsSigningJob } from "./job";
import type { PredictionsSigningIntentDefinition } from "./types";

/** Cross-platform definition of a Predictions signature: each app adds its component. */
export const predictionsSigningIntentDefinition: PredictionsSigningIntentDefinition = {
  label: "Predictions signature",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: predictionsSigningJob,
};
