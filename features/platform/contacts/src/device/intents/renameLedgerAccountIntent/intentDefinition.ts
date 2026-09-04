import { renameLedgerAccountIntentJob } from "./job";
import type { RenameLedgerAccountIntentDefinition } from "./types";

export const renameLedgerAccountIntentDefinition: RenameLedgerAccountIntentDefinition = {
  label: "Rename Ledger account",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: renameLedgerAccountIntentJob,
};
