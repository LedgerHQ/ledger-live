import React from "react";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import { useChartOptionsViewModel } from "./useChartOptionsViewModel";
import { ChartOptionsTrailing } from "./ChartOptionsTrailing";
import { ChartOptionsSheetView } from "./ChartOptionsSheetView";

type Props = Readonly<{
  currencyId?: string;
}>;

export function ChartOptions({ currencyId }: Props) {
  const {
    isHidden,
    isSheetOpen,
    openSheet,
    closeSheet,
    onToggleTransactions,
    trailingAccessibilityLabel,
    toggleTransactionsTitle,
  } = useChartOptionsViewModel({ currencyId });

  return (
    <>
      <ChartOptionsTrailing
        onPress={openSheet}
        accessibilityLabel={trailingAccessibilityLabel}
        testID={ASSET_DETAIL_TEST_IDS.chartOptionsTrailing}
      />
      <ChartOptionsSheetView
        isOpen={isSheetOpen}
        onClose={closeSheet}
        isHidden={isHidden}
        toggleTransactionsTitle={toggleTransactionsTitle}
        onToggleTransactions={onToggleTransactions}
      />
    </>
  );
}
