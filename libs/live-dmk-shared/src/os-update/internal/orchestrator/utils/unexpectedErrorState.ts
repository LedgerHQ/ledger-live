import { CreateBackupStateType } from "../../../api/model/CreateBackupState";
import { OsUpdatesSteps } from "../../../api/model/OsUpdatesSteps";
import { PreChecksStateType } from "../../../api/model/PreChecksState";
import type { OsUpdatesState } from "../types";

/** The unexpected error state of the given step, for failures the sub-machines never reported. */
export const unexpectedErrorState = (step: OsUpdatesSteps, cancel: () => void): OsUpdatesState => {
  switch (step) {
    case OsUpdatesSteps.PRE_CHECKS:
      return { type: PreChecksStateType.UNEXPECTED_ERROR, cancel };
    case OsUpdatesSteps.CREATE_BACKUP:
      return { type: CreateBackupStateType.UNEXPECTED_ERROR, cancel };
    default: {
      const unhandled: never = step;
      return unhandled;
    }
  }
};
