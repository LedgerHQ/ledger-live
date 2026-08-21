import { RegisterLedgerAccountComponent } from "./component";
import { registerLedgerAccountIntentJob } from "./job";
import type { RegisterLedgerAccountIntentPlatformDefinition } from "./types";

export const registerLedgerAccountIntentPlatformDefinition: RegisterLedgerAccountIntentPlatformDefinition =
  {
    label: "Register Ledger account",
    requiresConnectedDevice: true,
    delegateDeviceLockStateHandlingToExecutor: true,
    job: registerLedgerAccountIntentJob,
    component: RegisterLedgerAccountComponent,
  };
