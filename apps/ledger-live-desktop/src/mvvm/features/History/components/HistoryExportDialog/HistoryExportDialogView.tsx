import React from "react";
import type { HistoryExportDialogViewModel } from "./useHistoryExportDialogViewModel";
import { ExportResultScene } from "./components/ExportResultScene";
import { ExportScene } from "./components/ExportScene";

export function HistoryExportDialogView({
  success,
  error,
  resetState,
  ...props
}: Readonly<HistoryExportDialogViewModel>) {
  if (success) {
    return <ExportResultScene variant="success" />;
  }

  if (error) {
    return <ExportResultScene variant="error" onAction={resetState} />;
  }

  return <ExportScene {...props} />;
}
