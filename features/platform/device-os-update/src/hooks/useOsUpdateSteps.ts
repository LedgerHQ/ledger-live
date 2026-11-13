import { useCallback, useEffect, useRef, useState } from "react";
import { ApplyUpdatesStateType } from "../types/ApplyUpdatesState";
import type { OsUpdatesOrchestratorUseCaseInput } from "../types/OsUpdatesOrchestrator";
import type { OsUpdatesProgress } from "../types/OsUpdatesProgress";
import { OsUpdatesSteps } from "../types/OsUpdatesSteps";
import { PreChecksStateType } from "../types/PreChecksState";
import { RestoreBackupStateType } from "../types/RestoreBackupState";
import type { CloseConfirmationProps, OsUpdateStepProps } from "../types/OsUpdateStep";

export type UseOsUpdateStepsInput = Readonly<{
  /** The latest progress of the orchestrator, `null` before its first snapshot. */
  osUpdatesProgress: OsUpdatesProgress | null;
  connectedDevice: OsUpdatesOrchestratorUseCaseInput["connectedDevice"];
  onStop: () => void;
  /** Called once the updates are applied, before the user closes the flow. */
  onCompleted?: () => void;
  /**
   * Asks for a confirmation before stopping a run the user closes. Defaults to `true`; without it,
   * closing stops the run at once.
   */
  confirmClose?: boolean;
}>;

export type OsUpdateSteps = Readonly<{
  stepProps: OsUpdateStepProps;
  closeConfirmation: CloseConfirmationProps;
}>;

function isCompleted(progress: OsUpdatesProgress): boolean {
  switch (progress.step) {
    case OsUpdatesSteps.APPLY_UPDATES:
      return progress.state.type === ApplyUpdatesStateType.UPDATES_APPLIED;
    case OsUpdatesSteps.RESTORE_BACKUP:
      return progress.state.type === RestoreBackupStateType.BACKUP_RESTORED;
    case OsUpdatesSteps.PRE_CHECKS:
    case OsUpdatesSteps.CREATE_BACKUP:
      return false;
    default: {
      const unhandled: never = progress;
      return unhandled;
    }
  }
}

const INITIAL_PROGRESS: OsUpdatesProgress = {
  step: OsUpdatesSteps.PRE_CHECKS,
  state: { type: PreChecksStateType.LOADING },
};

/** Turns the orchestrator progress into step props, and decides when closing must be confirmed. */
export function useOsUpdateSteps({
  osUpdatesProgress: latestProgress,
  connectedDevice,
  onStop,
  onCompleted,
  confirmClose = true,
}: UseOsUpdateStepsInput): OsUpdateSteps {
  const osUpdatesProgress = latestProgress ?? INITIAL_PROGRESS;
  const [isCloseRequested, setIsCloseRequested] = useState(false);

  const hasCompleted = isCompleted(osUpdatesProgress);
  const onCompletedRef = useRef(onCompleted);
  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);
  useEffect(() => {
    if (hasCompleted) onCompletedRef.current?.();
  }, [hasCompleted]);
  const isCloseConfirmationOpen = isCloseRequested && !hasCompleted;

  const onUserClose = useCallback(() => {
    if (hasCompleted || !confirmClose) {
      onStop();
    } else {
      setIsCloseRequested(true);
    }
  }, [hasCompleted, confirmClose, onStop]);
  const onContinue = useCallback(() => setIsCloseRequested(false), []);
  const onCancel = useCallback(() => {
    setIsCloseRequested(false);
    onStop();
  }, [onStop]);

  return {
    stepProps: { ...osUpdatesProgress, connectedDevice, onUserClose, isCloseConfirmationOpen },
    closeConfirmation: { isOpen: isCloseConfirmationOpen, onContinue, onCancel },
  };
}
