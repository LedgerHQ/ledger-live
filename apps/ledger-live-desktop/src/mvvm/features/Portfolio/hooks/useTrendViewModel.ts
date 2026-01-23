import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { ValueChange } from "@ledgerhq/types-live";
import { discreetModeSelector } from "~/renderer/reducers/settings";

interface UseTrendViewModelOptions {
  readonly valueChange: ValueChange;
}

interface TrendViewModelResult {
  readonly percentageText: string;
  readonly isPositive: boolean;
  readonly isAvailable: boolean;
}

export const useTrendViewModel = ({
  valueChange,
}: UseTrendViewModelOptions): TrendViewModelResult => {
  const discreet = useSelector(discreetModeSelector);

  return useMemo(() => {
    const isAvailable = valueChange.percentage !== null && valueChange.percentage !== undefined;

    if (!isAvailable) {
      return {
        percentageText: "",
        isPositive: true,
        isAvailable: false,
      };
    }

    const percentage = valueChange.percentage ?? 0;
    const isPositive = percentage >= 0;

    // Format percentage (multiply by 100 since it's 0-1 range)
    const percentageText = discreet
      ? "***"
      : `${isPositive ? "+" : ""}${(percentage * 100).toFixed(2)}%`;

    return {
      percentageText,
      isPositive,
      isAvailable: true,
    };
  }, [valueChange, discreet]);
};
