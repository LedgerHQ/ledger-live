import { registerLedgerAccountIntentJob } from "./job";
import type { RegisterLedgerAccountIntentDefinition } from "./types";

export const registerLedgerAccountIntentDefinition: RegisterLedgerAccountIntentDefinition = {
  label: "Register Ledger account",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: registerLedgerAccountIntentJob,
};
