import React, { useRef } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import HistoryPageHeader from "./components/HistoryPageHeader";
import { HistoryList } from "./screens/HistoryList";
import type { HistoryViewModel } from "./hooks/useHistoryViewModel";

export function HistoryView({
  navigateBack,
  table,
  parentRef,
  rowVirtualizer,
  flatItems,
  onRowClick,
  onExportClick,
  operationsCount,
  hasPendingOperations,
}: Readonly<HistoryViewModel>) {
  const operationsCountRef = useRef(operationsCount);
  const hasPendingOperationsRef = useRef(hasPendingOperations);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-24" data-testid="history-page">
      <TrackPage
        category="OperationList"
        operationsCount={operationsCountRef.current}
        has_pending_operations={hasPendingOperationsRef.current ? true : false}
      />
      <HistoryPageHeader onBack={navigateBack} onExportClick={onExportClick} />
      <HistoryList
        table={table}
        parentRef={parentRef}
        rowVirtualizer={rowVirtualizer}
        flatItems={flatItems}
        onRowClick={onRowClick}
      />
    </div>
  );
}
