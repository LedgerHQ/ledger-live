import { signAccountTransactionIntentJob } from "./job";
import type { SignAccountTransactionIntentDefinition } from "./types";

/** Lock-state handling is left to the executor: the job only signs once the app runs. */
export const signAccountTransactionIntentDefinition: SignAccountTransactionIntentDefinition = {
  label: "Sign account transaction",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: signAccountTransactionIntentJob,
};
