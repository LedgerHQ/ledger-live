import { useEffect, useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { Unit } from "@domain/entity-currency-unit";
import type { BalanceFilter } from "../state";
import type { DefaultStablecoin, StablecoinItem } from "../logic/buildBalanceFilterOptions";
import { buildBalanceData } from "../logic/buildBalanceData";
import type { FormattedValue, BalanceData } from "../types";

export type UseBalanceDataParams = Readonly<{
  stablecoins: readonly StablecoinItem[];
  defaultStablecoins: readonly DefaultStablecoin[];
  filter: BalanceFilter;
  isLoading: boolean;
  isError: boolean;
  formatFiat: (value: number) => string;
  formatCrypto: (unit: Unit, balance: number) => string;
  formatCountervalue: (value: number) => FormattedValue;
  onConfirmFilter: (filter: BalanceFilter) => void;
  onResetFilter: () => void;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
}>;

// Host-facing data hook: both apps feed their portfolio source + formatters and get back
// the ready-to-render `BalanceData`, plus the stale-filter self-heal side effect.
export function useBalanceData({
  stablecoins,
  defaultStablecoins,
  filter,
  isLoading,
  isError,
  formatFiat,
  formatCrypto,
  formatCountervalue,
  onConfirmFilter,
  onResetFilter,
  onTrackEvent,
}: UseBalanceDataParams): BalanceData {
  const { t } = useTranslation();
  const allLabel = t("payTab.balance.filter.allStablecoins");

  const { data, shouldResetFilter } = useMemo(
    () =>
      buildBalanceData({
        stablecoins,
        defaultStablecoins,
        filter,
        isLoading,
        isError,
        allLabel,
        formatFiat,
        formatCrypto,
        formatCountervalue,
        onConfirmFilter,
        onTrackEvent,
      }),
    [
      stablecoins,
      defaultStablecoins,
      filter,
      isLoading,
      isError,
      allLabel,
      formatFiat,
      formatCrypto,
      formatCountervalue,
      onConfirmFilter,
      onTrackEvent,
    ],
  );

  useEffect(() => {
    if (shouldResetFilter) {
      onResetFilter();
    }
  }, [shouldResetFilter, onResetFilter]);

  return data;
}
