import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { ValueChange } from "@ledgerhq/types-live";
import { discreetModeSelector } from "~/renderer/reducers/settings";

interface UseTrendViewModelOptions {
  readonly valueChange: ValueChange;
}

type TrendVariant = "positive" | "negative" | "neutral";

const getTrendVariant = (percentage: number): TrendVariant => {
  if (percentage === 0) return "neutral";
  if (percentage > 0) return "positive";
  return "negative";
};

interface TrendViewModelResult {
  readonly percentageText: string;
  readonly variant: TrendVariant;
}

export const useTrendViewModel = ({
  valueChange,
}: UseTrendViewModelOptions): TrendViewModelResult => {
  const discreet = useSelector(discreetModeSelector);

  return useMemo(() => {
    const percentage = valueChange.percentage ?? 0;
    const variant = getTrendVariant(percentage);

    const sign = percentage > 0 ? "+" : "";
    const formattedPercentage = `${sign}${(percentage * 100).toFixed(2)}%`;
    const percentageText = discreet ? "***" : formattedPercentage;

    return {
      percentageText,
      variant,
    };
  }, [valueChange.percentage, discreet]);
};
