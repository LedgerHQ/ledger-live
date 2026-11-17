import type { ApplyUpdatesState } from "../../../types/ApplyUpdatesState";
import type { CreateBackupState } from "../../../types/CreateBackupState";
import type { OsUpdatesProgress } from "../../../types/OsUpdatesProgress";
import { OsUpdatesSteps } from "../../../types/OsUpdatesSteps";
import type { PreChecksState } from "../../../types/PreChecksState";
import type { RestoreBackupState } from "../../../types/RestoreBackupState";
import type { OsUpdatesOrchestratorStateMachineContext } from "../types";

export const toProgress = ({
  currentStep,
  currentState,
}: Pick<
  OsUpdatesOrchestratorStateMachineContext,
  "currentStep" | "currentState"
>): OsUpdatesProgress => {
  switch (currentStep) {
    case OsUpdatesSteps.PRE_CHECKS:
      return { step: currentStep, state: currentState as PreChecksState };
    case OsUpdatesSteps.CREATE_BACKUP:
      return { step: currentStep, state: currentState as CreateBackupState };
    case OsUpdatesSteps.APPLY_UPDATES:
      return { step: currentStep, state: currentState as ApplyUpdatesState };
    case OsUpdatesSteps.RESTORE_BACKUP:
      return { step: currentStep, state: currentState as RestoreBackupState };
    default: {
      const unhandled: never = currentStep;
      return unhandled;
    }
  }
};
