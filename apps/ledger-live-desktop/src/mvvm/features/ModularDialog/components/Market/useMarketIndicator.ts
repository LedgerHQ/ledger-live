import { useMemo } from "react";

export type PercentVariant = "positive" | "negative" | "neutral";

export const getPercentVariant = (percent: number): PercentVariant => {
  if (percent > 0) return "positive";
  if (percent < 0) return "negative";
  return "neutral";
};

export const formatPercentText = (percent: number): string => {
  if (percent > 0) return `+${percent}%`;
  if (percent < 0) return `-${Math.abs(percent)}%`;
  return `${percent}%`;
};

export const useMarketIndicator = (percent: number) => {
  return useMemo(
    () => ({
      variant: getPercentVariant(percent),
      percentText: formatPercentText(percent),
    }),
    [percent],
  );
};
