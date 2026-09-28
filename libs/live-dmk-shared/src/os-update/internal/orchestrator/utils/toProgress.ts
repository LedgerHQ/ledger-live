import { OsUpdatesSteps } from "../../../api/model/OsUpdatesSteps";
import type { CreateBackupState } from "../../../api/model/CreateBackupState";
import type { OsUpdatesProgress } from "../../../api/model/OsUpdatesProgress";
import type { PreChecksState } from "../../../api/model/PreChecksState";
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
    default: {
      const unhandled: never = currentStep;
      return unhandled;
    }
  }
};
