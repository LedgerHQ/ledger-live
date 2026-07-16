import React from "react";
import { AmountDisplay, Skeleton } from "@ledgerhq/lumen-ui-react";
import type { ChartSectionHeaderViewModel } from "./types";
import { ChartSectionHeaderVariation } from "./ChartSectionHeaderVariation";

type ChartSectionHeaderViewProps = Readonly<{
  viewModel: ChartSectionHeaderViewModel;
}>;

export function ChartSectionHeaderView({ viewModel }: ChartSectionHeaderViewProps) {
  const {
    balance,
    balanceAvailable,
    isLoading,
    balanceFormatter,
    discreet,
    percentageValue,
    variationText,
    rangeLabel,
  } = viewModel;

  return (
    <div className="flex items-end gap-12" data-testid="analytics-chart-header">
      {balanceAvailable ? (
        <AmountDisplay
          value={balance}
          formatter={balanceFormatter}
          hidden={discreet}
          loading={isLoading}
          data-testid="analytics-balance-amount"
        />
      ) : (
        <Skeleton className="h-48 w-256 rounded-md" data-testid="analytics-balance-skeleton" />
      )}
      {balanceAvailable && (
        <ChartSectionHeaderVariation
          percentageValue={percentageValue}
          discreet={discreet}
          variationText={variationText}
          rangeLabel={rangeLabel}
        />
      )}
    </div>
  );
}
