import React from "react";
import { AmountDisplay, Skeleton } from "@ledgerhq/lumen-ui-react";
import type { ChartSectionHeaderViewModel } from "./types";
import { ChartSectionHeaderVariation } from "./ChartSectionHeaderVariation";

type ChartSectionHeaderViewProps = Readonly<{
  viewModel: ChartSectionHeaderViewModel;
}>;

export function ChartSectionHeaderView({ viewModel }: ChartSectionHeaderViewProps) {
  const {
    totalBalanceLabel,
    balance,
    balanceAvailable,
    isLoading,
    balanceFormatter,
    discreet,
    percentageValue,
    variationText,
    rangeLabel,
    scrubDateLabel,
  } = viewModel;

  const isScrubbing = scrubDateLabel != null;

  return (
    <div className="flex flex-col gap-8" data-testid="analytics-chart-header">
      <span className="body-2 text-muted" data-testid="analytics-total-balance-label">
        {totalBalanceLabel}
      </span>
      <div className="flex items-end gap-12">
        {balanceAvailable ? (
          <AmountDisplay
            value={balance}
            formatter={balanceFormatter}
            hidden={discreet}
            loading={isLoading}
            animate={!isScrubbing}
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
            timeLabel={scrubDateLabel ?? rangeLabel}
            isScrubbing={isScrubbing}
          />
        )}
      </div>
    </div>
  );
}
