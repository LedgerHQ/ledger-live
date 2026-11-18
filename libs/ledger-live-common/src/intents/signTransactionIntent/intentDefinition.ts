import { signTransactionIntentJob, signTransactionIntentJobWithResult } from "./job";
import type {
  SignTransactionIntentDefinition,
  SignTransactionIntentWithResultDefinition,
} from "./types";

export const signTransactionIntentDefinition: SignTransactionIntentDefinition = {
  label: "Sign transaction",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: signTransactionIntentJob,
};

export const signTransactionIntentWithResultDefinition: SignTransactionIntentWithResultDefinition =
  {
    ...signTransactionIntentDefinition,
    job: signTransactionIntentJobWithResult,
  };
