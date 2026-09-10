import { signRawTransactionIntentJob } from "./job";
import type { SignRawTransactionIntentDefinition } from "./types";

export const signRawTransactionIntentDefinition: SignRawTransactionIntentDefinition = {
  label: "Sign raw transaction",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: signRawTransactionIntentJob,
};
