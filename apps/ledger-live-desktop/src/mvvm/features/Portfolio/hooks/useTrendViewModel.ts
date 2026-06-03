import { useMemo } from "react";
import { ValueChange } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { discreetModeSelector } from "~/renderer/reducers/settings";

interface UseTrendViewModelOptions {
  readonly valueChange: ValueChange;
  readonly useDiscreetMasking?: boolean;
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
  useDiscreetMasking = true,
}: UseTrendViewModelOptions): TrendViewModelResult => {
  const discreet = useSelector(discreetModeSelector);

  return useMemo(() => {
    const percentage = valueChange.percentage ?? 0;
    const variant = getTrendVariant(percentage);

    const sign = percentage > 0 ? "+" : "";
    const shouldMaskPercentage = useDiscreetMasking && discreet;
    const percentageText = shouldMaskPercentage ? "***" : `${sign}${(percentage * 100).toFixed(2)}%`;

    return {
      percentageText,
      variant,
    };
  }, [discreet, useDiscreetMasking, valueChange.percentage]);
};
