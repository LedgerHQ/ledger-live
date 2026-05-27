import React from "react";
import type { HistoryExportDialogViewModel } from "./useHistoryExportDialogViewModel";
import { ExportResultScene } from "./components/ExportResultScene";
import { ExportScene } from "./components/ExportScene";

export function HistoryExportDialogView({
  success,
  error,
  resetState,
  onDoneClick,
  ...props
}: Readonly<HistoryExportDialogViewModel>) {
  if (success) {
    return <ExportResultScene variant="success" onButtonClick={onDoneClick} />;
  }

  if (error) {
    return <ExportResultScene variant="error" onButtonClick={resetState} />;
  }

  return <ExportScene {...props} />;
}
