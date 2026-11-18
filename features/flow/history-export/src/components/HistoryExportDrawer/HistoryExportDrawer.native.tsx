import React, { useCallback, useState } from "react";
import { useHistoryExportViewModel } from "../../useHistoryExportViewModel";
import { HistoryExportDrawerView } from "./HistoryExportDrawerView";
import type { HistoryExportDrawerProps } from "./types";

/** Mount it only while open: the view model syncs the accounts on mount. */
export function HistoryExportDrawer({ onClose, port }: HistoryExportDrawerProps) {
  const { exportCsv, onDoneClick, ...vm } = useHistoryExportViewModel({ port });
  const [isRequested, setIsRequested] = useState(true);

  const onExport = useCallback(() => {
    void exportCsv();
  }, [exportCsv]);

  const onDone = useCallback(() => {
    onDoneClick();
    setIsRequested(false);
  }, [onDoneClick]);

  return (
    <HistoryExportDrawerView
      {...vm}
      isRequested={isRequested}
      onExport={onExport}
      onDone={onDone}
      onClose={onClose}
    />
  );
}
