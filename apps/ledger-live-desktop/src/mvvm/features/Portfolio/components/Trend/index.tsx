import React from "react";
import { ValueChange } from "@ledgerhq/types-live";
import { cn } from "LLD/utils/cn";
import { useTrendViewModel } from "../../hooks/useTrendViewModel";

interface TrendProps {
  readonly valueChange: ValueChange;
}

export const Trend = ({ valueChange }: TrendProps) => {
  const { percentageText, isPositive, isAvailable } = useTrendViewModel({
    valueChange,
  });

  if (!isAvailable) {
    return null;
  }

  const colorClass = isPositive ? "text-success" : "text-error";

  return (
    <div className={cn("flex items-center gap-4", colorClass)} data-testid="portfolio-trend">
      <span className="body-2-semi-bold">{percentageText}</span>
    </div>
  );
};
