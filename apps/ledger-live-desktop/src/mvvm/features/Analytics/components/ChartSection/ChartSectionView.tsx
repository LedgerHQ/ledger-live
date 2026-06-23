import React from "react";
import { AmountDisplay, Skeleton } from "@ledgerhq/lumen-ui-react";
import { LineChart } from "LLD/components/LineChart";
import { Trend } from "LLD/features/Portfolio/components/Trend";
import type { ChartSectionViewModelResult } from "./useChartSectionViewModel";

type ChartSectionViewProps = Readonly<ChartSectionViewModelResult>;

export function ChartSectionView({
  title,
  rangeLabel,
  balance,
  balanceAvailable,
  isLoading,
  shouldDisplayBalanceRefreshRework,
  balanceFormatter,
  valueChange,
  series,
  height,
  selectedRange,
  onRangeChange,
  color,
  isChartLoading,
  formatValue,
  tooltipTitle,
  onScrubberPositionChange,
  showXAxis,
  showYAxis,
  xAxis,
  yAxis,
  points,
  ranges,
  discreet,
}: ChartSectionViewProps) {
  return (
    <div className="flex flex-col gap-24 px-24 py-20" data-testid="analytics-chart-section">
      <div className="flex flex-col gap-12">
        <span className="body-2 text-muted">{title}</span>
        <div className="flex flex-wrap items-baseline gap-12">
          {balanceAvailable ? (
            <AmountDisplay
              value={balance}
              formatter={balanceFormatter}
              hidden={discreet}
              loading={shouldDisplayBalanceRefreshRework && isLoading}
              data-testid="analytics-balance-amount"
            />
          ) : (
            <Skeleton className="h-48 w-256 rounded-md" data-testid="analytics-balance-skeleton" />
          )}
          {balanceAvailable && (
            <Trend
              valueChange={valueChange}
              suffixLabel={rangeLabel}
              className="items-baseline"
              testId="analytics-balance-trend"
              percentageTestId="analytics-balance-trend-percentage"
            />
          )}
        </div>
      </div>

      <LineChart
        series={series}
        selectedRange={selectedRange}
        onRangeChange={onRangeChange}
        color={color}
        height={height}
        isLoading={isChartLoading}
        formatValue={formatValue}
        tooltipTitle={tooltipTitle}
        showScrubberTooltip={true}
        onScrubberPositionChange={onScrubberPositionChange}
        showXAxis={showXAxis}
        showYAxis={showYAxis}
        xAxis={xAxis}
        yAxis={yAxis}
        points={points}
        ranges={ranges}
      />
    </div>
  );
}
