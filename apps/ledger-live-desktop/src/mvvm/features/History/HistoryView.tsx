import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import HistoryPageHeader from "./components/HistoryPageHeader";
import { HistoryList } from "./screens/HistoryList";
import type { HistoryViewModel } from "./useHistoryViewModel";
import { HistoryActionsBar } from "./components/HistoryActionsBar";

export function HistoryView({
  navigateToDashboard,
  table,
  parentRef,
  rowVirtualizer,
  flatItems,
  onRowClick,
}: Readonly<HistoryViewModel>) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-24">
      <TrackPage category="History" />
      <HistoryPageHeader onBack={navigateToDashboard} />
      <HistoryActionsBar />
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
