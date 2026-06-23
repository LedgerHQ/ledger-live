import React from "react";
import { TriangleDown, TriangleUp } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";
import { trendPercentageBody2Styles } from "LLD/shared/trendPercentageStyles";

type ChartSectionHeaderVariationProps = Readonly<{
  percentageText: string;
  variationText: string;
  variationVariant: "positive" | "negative" | "neutral";
  rangeLabel: string;
}>;

const TREND_ICONS = {
  positive: { Icon: TriangleUp, className: "text-success" },
  negative: { Icon: TriangleDown, className: "text-error" },
  neutral: { Icon: TriangleUp, className: "text-disabled" },
} as const;

export function ChartSectionHeaderVariation({
  percentageText,
  variationText,
  variationVariant,
  rangeLabel,
}: ChartSectionHeaderVariationProps) {
  const { Icon, className } = TREND_ICONS[variationVariant];

  return (
    <div className="flex items-center gap-4" data-testid="analytics-balance-trend">
      <Icon size={16} className={cn(className)} aria-hidden />
      <span
        className={trendPercentageBody2Styles({ variant: variationVariant })}
        data-testid="analytics-balance-trend-percentage"
      >
        {percentageText}
      </span>
      <span
        className="body-2 tabular-nums text-muted"
        data-testid="analytics-balance-trend-value"
      >
        {variationText}
      </span>
      <span className="body-2 text-muted">{rangeLabel}</span>
    </div>
  );
}
