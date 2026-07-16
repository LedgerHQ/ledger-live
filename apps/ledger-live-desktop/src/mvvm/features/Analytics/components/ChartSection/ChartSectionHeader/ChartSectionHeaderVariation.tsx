import React from "react";
import { Trend } from "@ledgerhq/lumen-ui-react";

type ChartSectionHeaderVariationProps = Readonly<{
  percentageValue: number;
  discreet: boolean;
  variationText: string;
  rangeLabel: string;
}>;

export function ChartSectionHeaderVariation({
  percentageValue,
  discreet,
  variationText,
  rangeLabel,
}: ChartSectionHeaderVariationProps) {
  return (
    <div className="flex items-center gap-4" data-testid="analytics-balance-trend">
      {!discreet && (
        <Trend value={percentageValue} size="sm" data-testid="analytics-balance-trend-percentage" />
      )}
      <span className="body-2 text-muted" data-testid="analytics-balance-trend-value">
        {variationText}
      </span>
      <span className="body-2 text-muted">·</span>
      <span className="body-2 text-muted">{rangeLabel}</span>
    </div>
  );
}
