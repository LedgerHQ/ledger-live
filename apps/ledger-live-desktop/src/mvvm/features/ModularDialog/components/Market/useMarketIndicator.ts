import { useMemo } from "react";
import { formatTrendPercent, getTrendTone, type TrendTone } from "@shared/trend";

export type PercentVariant = TrendTone;

export const getPercentVariant = (percent: number): PercentVariant => getTrendTone(percent);

export const formatPercentText = (percent: number): string =>
  formatTrendPercent(percent, { decimals: null });

export const useMarketIndicator = (percent: number) => {
  return useMemo(
    () => ({
      variant: getPercentVariant(percent),
      percentText: formatPercentText(percent),
    }),
    [percent],
  );
};
