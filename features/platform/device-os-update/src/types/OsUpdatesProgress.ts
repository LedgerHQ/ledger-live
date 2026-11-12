import type { ApplyUpdatesState } from "./ApplyUpdatesState";
import type { CreateBackupState } from "./CreateBackupState";
import { OsUpdatesSteps } from "./OsUpdatesSteps";
import type { PreChecksState } from "./PreChecksState";
import type { RestoreBackupState } from "./RestoreBackupState";

export type OsUpdatesProgress =
  | {
      step: OsUpdatesSteps.PRE_CHECKS;
      state: PreChecksState;
    }
  | {
      step: OsUpdatesSteps.CREATE_BACKUP;
      state: CreateBackupState;
    }
  | {
      step: OsUpdatesSteps.APPLY_UPDATES;
      state: ApplyUpdatesState;
    }
  | {
      step: OsUpdatesSteps.RESTORE_BACKUP;
      state: RestoreBackupState;
    };
