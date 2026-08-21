import { RenameLedgerAccountComponent } from "./component";
import { renameLedgerAccountIntentJob } from "./job";
import type { RenameLedgerAccountIntentPlatformDefinition } from "./types";

export const renameLedgerAccountIntentPlatformDefinition: RenameLedgerAccountIntentPlatformDefinition =
  {
    label: "Rename Ledger account",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: true,
    job: renameLedgerAccountIntentJob,
    component: RenameLedgerAccountComponent,
  };
