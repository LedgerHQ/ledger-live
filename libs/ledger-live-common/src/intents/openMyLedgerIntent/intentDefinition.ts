import { openMyLedgerIntentJob } from "./job";
import type { OpenMyLedgerIntentDefinition } from "./types";

export const openMyLedgerIntentDefinition: OpenMyLedgerIntentDefinition = {
  label: "Open My Ledger",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: false,
  job: openMyLedgerIntentJob,
};
