import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import HistoryPageHeader from "./components/HistoryPageHeader";
import { HistoryActionsList } from "./components/HistoryActionsList";
import { HistoryList } from "./screens/HistoryList";
import type { HistoryViewModel } from "./useHistoryViewModel";

export function HistoryView({
  navigateToDashboard,
  table,
  parentRef,
  rowVirtualizer,
  flatItems,
  onRowClick,
  onExportClick,
  operationsCount,
  hasPendingOperations,
  selectedType,
  onTypeChange,
}: Readonly<HistoryViewModel>) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-24">
      <TrackPage
        category="OperationList"
        operationsCount={operationsCount}
        has_pending_operations={hasPendingOperations ? true : false}
      />
      <HistoryPageHeader onBack={navigateToDashboard} />
      <HistoryActionsList
        selectedType={selectedType}
        onTypeChange={onTypeChange}
        onExportClick={onExportClick}
      />
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
