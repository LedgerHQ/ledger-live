import { signAccountMessageIntentJob } from "./job";
import type { SignAccountMessageIntentDefinition } from "./types";

/** Lock-state handling is left to the executor: the job only signs once the app runs. */
export const signAccountMessageIntentDefinition: SignAccountMessageIntentDefinition = {
  label: "Sign account message",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: signAccountMessageIntentJob,
};
