import { useEffect, useMemo } from "react";
import type { Unit } from "@domain/entity-currency-unit";
import type { PayCardBalanceFilter } from "../state";
import type { DefaultStablecoin, PayCardStablecoinItem } from "../logic/buildBalanceFilterOptions";
import { buildPayCardBalanceData } from "../logic/buildPayCardBalanceData";
import type { FormattedValue, PayCardBalanceData } from "../types";

export type UsePayCardBalanceDataParams = Readonly<{
  stablecoins: readonly PayCardStablecoinItem[];
  defaultStablecoins: readonly DefaultStablecoin[];
  filter: PayCardBalanceFilter;
  isLoading: boolean;
  isError: boolean;
  allLabel: string;
  formatFiat: (value: number) => string;
  formatCrypto: (unit: Unit, balance: number) => string;
  formatCountervalue: (value: number) => FormattedValue;
  onConfirmFilter: (filter: PayCardBalanceFilter) => void;
  onResetFilter: () => void;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
}>;

// Host-facing data hook: both apps feed their portfolio source + formatters and get back
// the ready-to-render `PayCardBalanceData`, plus the stale-filter self-heal side effect.
export function usePayCardBalanceData({
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
  onResetFilter,
  onTrackEvent,
}: UsePayCardBalanceDataParams): PayCardBalanceData {
  const { data, shouldResetFilter } = useMemo(
    () =>
      buildPayCardBalanceData({
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
