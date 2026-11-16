import { useOsUpdatesOrchestrator } from "../../hooks/useOsUpdatesOrchestrator";
import { useOsUpdateSteps } from "../../hooks/useOsUpdateSteps";
import type { OsUpdatesOrchestratorProps } from "./OsUpdatesOrchestrator";

/** Runs the orchestrator, and gives the view the current step and the close confirmation. */
export function useOsUpdatesOrchestratorViewModel({
  dmk,
  connectedDevice,
  osUpdates,
  backupStorage,
  renderStep,
  onStop,
  renderCloseConfirmation,
  onCompleted,
  unlockTimeout,
}: OsUpdatesOrchestratorProps) {
  const { osUpdatesProgress } = useOsUpdatesOrchestrator({
    dmk,
    connectedDevice,
    osUpdates,
    storage: backupStorage,
    onStop,
    unlockTimeout,
  });
  const { stepProps, closeConfirmation } = useOsUpdateSteps({
    osUpdatesProgress,
    connectedDevice,
    onStop,
    onCompleted,
    confirmClose: renderCloseConfirmation !== undefined,
  });

  return { stepProps, closeConfirmation, renderStep, renderCloseConfirmation };
}

export type OsUpdatesOrchestratorViewProps = ReturnType<typeof useOsUpdatesOrchestratorViewModel>;
