import { useMemo } from "react";
import { ValueChange } from "@ledgerhq/types-live";
import { formatTrendPercent, getTrendTone, type TrendTone } from "@shared/trend";
import { useSelector } from "LLD/hooks/redux";
import { discreetModeSelector } from "~/renderer/reducers/settings";

interface UseTrendViewModelOptions {
  readonly valueChange: ValueChange;
  readonly useDiscreetMasking?: boolean;
}

interface TrendViewModelResult {
  readonly percentageText: string;
  readonly variant: TrendTone;
}

export const useTrendViewModel = ({
  valueChange,
  useDiscreetMasking = true,
}: UseTrendViewModelOptions): TrendViewModelResult => {
  const discreet = useSelector(discreetModeSelector);

  return useMemo(() => {
    const percentage = valueChange.percentage ?? 0;
    const variant = getTrendTone(percentage);

    const shouldMaskPercentage = useDiscreetMasking && discreet;
    const percentageText = shouldMaskPercentage ? "***" : formatTrendPercent(percentage * 100);

    return {
      percentageText,
      variant,
    };
  }, [discreet, useDiscreetMasking, valueChange.percentage]);
};
