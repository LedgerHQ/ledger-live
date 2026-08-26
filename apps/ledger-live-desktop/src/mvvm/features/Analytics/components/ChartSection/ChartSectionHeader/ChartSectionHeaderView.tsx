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
    countervalueComplete,
    countervalueTrendComplete,
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
          countervalueComplete ? (
            <AmountDisplay
              value={balance}
              formatter={balanceFormatter}
              hidden={discreet}
              loading={isLoading}
              animate={!isScrubbing}
              data-testid="analytics-balance-amount"
            />
          ) : (
            <span
              className="heading-1-semi-bold text-base"
              data-testid="analytics-balance-unavailable"
            >
              -
            </span>
          )
        ) : (
          <Skeleton className="h-48 w-256 rounded-md" data-testid="analytics-balance-skeleton" />
        )}
        {balanceAvailable &&
          (countervalueTrendComplete ? (
            <ChartSectionHeaderVariation
              percentageValue={percentageValue}
              discreet={discreet}
              variationText={variationText}
              timeLabel={scrubDateLabel ?? rangeLabel}
              isScrubbing={isScrubbing}
            />
          ) : (
            <span className="body-2 text-muted" data-testid="analytics-variation-unavailable">
              -
            </span>
          ))}
      </div>
    </div>
  );
}
