import React, { useRef } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { HISTORY_TAB_CARD } from "./constants";
import HistoryPageHeader from "./components/HistoryPageHeader";
import { HistoryTypeSwitcher } from "./components/HistoryTypeSwitcher";
import { CardHistory } from "./components/CardHistory";
import { HistoryList } from "./screens/HistoryList";
import type { HistoryViewModel } from "./hooks/useHistoryViewModel";
import type { CardHistoryViewModel } from "./components/CardHistory/types";

type HistoryViewProps = Readonly<HistoryViewModel & { cardHistoryViewModel: CardHistoryViewModel }>;

export function HistoryView({
  showBackButton,
  navigateBack,
  table,
  parentRef,
  rowVirtualizer,
  flatItems,
  onRowClick,
  onExportClick,
  operationsCount,
  hasPendingOperations,
  showDustFilterOption,
  hideSmallValueTokenOperations,
  dustFilterThreshold,
  onToggleHideSmallValueTokenOperations,
  contact,
  showHistoryTypeSwitcher,
  historyTab,
  cardAsset,
  cardAssetName,
  onHistoryTabChange,
  cardHistoryViewModel,
}: HistoryViewProps) {
  const operationsCountRef = useRef(operationsCount);
  const hasPendingOperationsRef = useRef(hasPendingOperations);
  const isCardTab = historyTab === HISTORY_TAB_CARD;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-24" data-testid="history-page">
      <TrackPage
        category="OperationList"
        operationsCount={operationsCountRef.current}
        has_pending_operations={hasPendingOperationsRef.current}
      />
      <HistoryPageHeader
        onBack={showBackButton ? navigateBack : undefined}
        onExportClick={onExportClick}
        showDustFilterOption={showDustFilterOption}
        hideSmallValueTokenOperations={hideSmallValueTokenOperations}
        dustFilterThreshold={dustFilterThreshold}
        onToggleHideSmallValueTokenOperations={onToggleHideSmallValueTokenOperations}
        contact={isCardTab ? undefined : contact}
        isCardHistory={isCardTab}
        cardAssetName={cardAssetName}
      />
      {showHistoryTypeSwitcher ? (
        <HistoryTypeSwitcher selectedTab={historyTab} onTabChange={onHistoryTabChange} />
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isCardTab ? (
          <CardHistory {...cardHistoryViewModel} asset={cardAsset} />
        ) : (
          <HistoryList
            table={table}
            parentRef={parentRef}
            rowVirtualizer={rowVirtualizer}
            flatItems={flatItems}
            onRowClick={onRowClick}
          />
        )}
      </div>
    </div>
  );
}
