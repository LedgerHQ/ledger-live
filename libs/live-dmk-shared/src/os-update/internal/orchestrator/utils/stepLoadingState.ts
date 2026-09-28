import { CreateBackupStateType } from "../../../api/model/CreateBackupState";
import { OsUpdatesSteps } from "../../../api/model/OsUpdatesSteps";
import { PreChecksStateType } from "../../../api/model/PreChecksState";
import type { OsUpdatesState } from "../types";

/** The state a step displays before its sub-machine has anything to report. */
export const stepLoadingState = (step: OsUpdatesSteps): OsUpdatesState => {
  switch (step) {
    case OsUpdatesSteps.PRE_CHECKS:
      return { type: PreChecksStateType.LOADING };
    case OsUpdatesSteps.CREATE_BACKUP:
      return { type: CreateBackupStateType.LOADING };
    default: {
      const unhandled: never = step;
      return unhandled;
    }
  }
};
