import { ApplyUpdatesStateType } from "../../../types/ApplyUpdatesState";
import { CreateBackupStateType } from "../../../types/CreateBackupState";
import { OsUpdatesSteps } from "../../../types/OsUpdatesSteps";
import { PreChecksStateType } from "../../../types/PreChecksState";
import { RestoreBackupStateType } from "../../../types/RestoreBackupState";
import type { OsUpdatesState } from "../types";

/** The unexpected error state of the given step, for failures the sub-machines never reported. */
export const unexpectedErrorState = (
  step: OsUpdatesSteps,
  cancel: () => void,
  error: unknown,
): OsUpdatesState => {
  switch (step) {
    case OsUpdatesSteps.PRE_CHECKS:
      return { type: PreChecksStateType.UNEXPECTED_ERROR, error, cancel };
    case OsUpdatesSteps.CREATE_BACKUP:
      return { type: CreateBackupStateType.UNEXPECTED_ERROR, error, cancel };
    case OsUpdatesSteps.APPLY_UPDATES:
      return { type: ApplyUpdatesStateType.UNEXPECTED_ERROR, error, cancel };
    case OsUpdatesSteps.RESTORE_BACKUP:
      return { type: RestoreBackupStateType.UNEXPECTED_ERROR, error, cancel };
    default: {
      const unhandled: never = step;
      return unhandled;
    }
  }
};
