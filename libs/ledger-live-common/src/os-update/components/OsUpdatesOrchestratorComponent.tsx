import React, { useCallback, useState } from "react";
import {
  ApplyUpdatesStateType,
  OsUpdatesSteps,
  PreChecksStateType,
  RestoreBackupStateType,
  type OsUpdatesOrchestratorUseCaseInput,
  type OsUpdatesProgress,
} from "@ledgerhq/live-dmk-shared";
import { useOsUpdatesOrchestrator } from "../hooks/useOsUpdatesOrchestrator";
import type { OsUpdatePlatformComponents } from "../types";

export type OsUpdatesOrchestratorComponentProps = OsUpdatesOrchestratorUseCaseInput & {
  platformComponents: OsUpdatePlatformComponents;
};

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

export function OsUpdatesOrchestratorComponent({
  platformComponents,
  ...orchestratorInput
}: OsUpdatesOrchestratorComponentProps): React.ReactElement | null {
  const { connectedDevice, onStop } = orchestratorInput;
  const { osUpdatesProgress: latestProgress } = useOsUpdatesOrchestrator(orchestratorInput);
  const osUpdatesProgress = latestProgress ?? INITIAL_PROGRESS;
  const [isCloseRequested, setIsCloseRequested] = useState(false);

  const hasCompleted = isCompleted(osUpdatesProgress);
  const isCloseConfirmationOpen = isCloseRequested && !hasCompleted;

  const onUserClose = useCallback(() => {
    if (hasCompleted) {
      onStop();
    } else {
      setIsCloseRequested(true);
    }
  }, [hasCompleted, onStop]);
  const onContinue = useCallback(() => setIsCloseRequested(false), []);
  const onCancel = useCallback(() => {
    setIsCloseRequested(false);
    onStop();
  }, [onStop]);

  const {
    PreChecksComponent,
    CreateBackupComponent,
    ApplyUpdatesComponent,
    RestoreBackupComponent,
    CloseConfirmationComponent,
  } = platformComponents;
  const stepProps = { connectedDevice, onUserClose, isCloseConfirmationOpen };

  const renderStep = () => {
    switch (osUpdatesProgress.step) {
      case OsUpdatesSteps.PRE_CHECKS:
        return (
          <PreChecksComponent
            step={osUpdatesProgress.step}
            state={osUpdatesProgress.state}
            {...stepProps}
          />
        );
      case OsUpdatesSteps.CREATE_BACKUP:
        return (
          <CreateBackupComponent
            step={osUpdatesProgress.step}
            state={osUpdatesProgress.state}
            {...stepProps}
          />
        );
      case OsUpdatesSteps.APPLY_UPDATES:
        return (
          <ApplyUpdatesComponent
            step={osUpdatesProgress.step}
            state={osUpdatesProgress.state}
            {...stepProps}
          />
        );
      case OsUpdatesSteps.RESTORE_BACKUP:
        return (
          <RestoreBackupComponent
            step={osUpdatesProgress.step}
            state={osUpdatesProgress.state}
            {...stepProps}
          />
        );
      default: {
        const unhandled: never = osUpdatesProgress;
        return unhandled;
      }
    }
  };

  return (
    <>
      {renderStep()}
      <CloseConfirmationComponent
        isOpen={isCloseConfirmationOpen}
        onContinue={onContinue}
        onCancel={onCancel}
      />
    </>
  );
}
