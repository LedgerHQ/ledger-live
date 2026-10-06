import type { OsUpdatePlatformComponents } from "@ledgerhq/live-common/os-update/types";
import { CloseConfirmation } from "../CloseConfirmation";
import { OsUpdateStep } from "../OsUpdateStep";

// The very same component is injected for every step on purpose: see `OsUpdateStep`.
export const osUpdatePlatformComponents: OsUpdatePlatformComponents = {
  PreChecksComponent: OsUpdateStep,
  CreateBackupComponent: OsUpdateStep,
  ApplyUpdatesComponent: OsUpdateStep,
  RestoreBackupComponent: OsUpdateStep,
  CloseConfirmationComponent: CloseConfirmation,
};
