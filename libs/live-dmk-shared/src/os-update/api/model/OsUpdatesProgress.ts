import type { CreateBackupState } from "./CreateBackupState";
import { OsUpdatesSteps } from "./OsUpdatesSteps";
import type { PreChecksState } from "./PreChecksState";

export type OsUpdatesProgress =
  | {
      step: OsUpdatesSteps.PRE_CHECKS;
      state: PreChecksState;
    }
  | {
      step: OsUpdatesSteps.CREATE_BACKUP;
      state: CreateBackupState;
    };
