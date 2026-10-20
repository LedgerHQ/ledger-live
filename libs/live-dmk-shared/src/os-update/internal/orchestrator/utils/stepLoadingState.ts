import { ApplyUpdatesStateType } from "../../../api/model/ApplyUpdatesState";
import { CreateBackupStateType } from "../../../api/model/CreateBackupState";
import { OsUpdatesSteps } from "../../../api/model/OsUpdatesSteps";
import { PreChecksStateType } from "../../../api/model/PreChecksState";
import { RestoreBackupStateType } from "../../../api/model/RestoreBackupState";
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
