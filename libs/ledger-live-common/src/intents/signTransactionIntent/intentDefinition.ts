import { signTransactionIntentJob } from "./job";
import type { SignTransactionIntentDefinition } from "./types";

export const signTransactionIntentDefinition: SignTransactionIntentDefinition = {
  label: "Sign transaction",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: signTransactionIntentJob,
};
