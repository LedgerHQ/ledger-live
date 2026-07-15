import React from "react";
import { Trend } from "@ledgerhq/lumen-ui-react";

type ChartSectionHeaderVariationProps = Readonly<{
  percentageValue: number;
  discreet: boolean;
  variationText: string;
  timeLabel: string;
  isScrubbing: boolean;
}>;

export function ChartSectionHeaderVariation({
  percentageValue,
  discreet,
  variationText,
  timeLabel,
  isScrubbing,
}: ChartSectionHeaderVariationProps) {
  return (
    <div className="flex items-center gap-4" data-testid="analytics-balance-trend">
      {!discreet && (
        <Trend value={percentageValue} size="md" data-testid="analytics-balance-trend-percentage" />
      )}
      <span className="body-2 text-muted" data-testid="analytics-balance-trend-value">
        {variationText}
      </span>
      {!isScrubbing && <span className="body-2 text-muted">·</span>}
      <span className="body-2 text-muted" data-testid="analytics-balance-trend-time">
        {timeLabel}
      </span>
    </div>
  );
}
