import { ApplyUpdatesStateType } from "../../../types/ApplyUpdatesState";
import { CreateBackupStateType } from "../../../types/CreateBackupState";
import { OsUpdatesSteps } from "../../../types/OsUpdatesSteps";
import { PreChecksStateType } from "../../../types/PreChecksState";
import { RestoreBackupStateType } from "../../../types/RestoreBackupState";
import type { OsUpdatesState } from "../types";

/** The state a step displays before its sub-machine has anything to report. */
export const stepLoadingState = (step: OsUpdatesSteps): OsUpdatesState => {
  switch (step) {
    case OsUpdatesSteps.PRE_CHECKS:
      return { type: PreChecksStateType.LOADING };
    case OsUpdatesSteps.CREATE_BACKUP:
      return { type: CreateBackupStateType.LOADING };
    case OsUpdatesSteps.APPLY_UPDATES:
      return { type: ApplyUpdatesStateType.LOADING };
    case OsUpdatesSteps.RESTORE_BACKUP:
      return { type: RestoreBackupStateType.LOADING };
    default: {
      const unhandled: never = step;
      return unhandled;
    }
  }
};
