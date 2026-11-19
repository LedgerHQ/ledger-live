import React from "react";
import type { HistoryExportViewModel } from "../../useHistoryExportViewModel";
import { ExportResultScene } from "./internals/ExportResultScene";
import { ExportScene } from "./internals/ExportScene";

export function HistoryExportDialogView({
  success,
  error,
  resetState,
  onDoneClick,
  ...props
}: Readonly<HistoryExportViewModel>) {
  if (success) {
    return <ExportResultScene variant="success" onButtonClick={onDoneClick} />;
  }

  if (error) {
    return <ExportResultScene variant="error" onButtonClick={resetState} />;
  }

  return <ExportScene {...props} />;
}
