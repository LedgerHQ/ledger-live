import React from "react";
import type { OsUpdatesOrchestratorViewProps } from "./useOsUpdatesOrchestratorViewModel";

export function OsUpdatesOrchestratorView({
  stepProps,
  closeConfirmation,
  renderStep,
  renderCloseConfirmation,
}: Readonly<OsUpdatesOrchestratorViewProps>) {
  return (
    <>
      {renderStep(stepProps)}
      {renderCloseConfirmation?.(closeConfirmation)}
    </>
  );
}
