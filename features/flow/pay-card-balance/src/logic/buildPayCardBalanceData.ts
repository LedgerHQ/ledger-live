import type { Unit } from "@domain/entity-currency-unit";
import type { PayCardBalanceFilter } from "@domain/entity-pay-card";
import { aggregatePayCardBalance } from "./aggregatePayCardBalance";
import {
  buildBalanceFilterOptions,
  type DefaultStablecoin,
  type PayCardStablecoinItem,
} from "./buildBalanceFilterOptions";
import type { FormattedValue, PayCardBalanceData } from "../types";

export type BuildPayCardBalanceDataParams = Readonly<{
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
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
}>;

export type BuildPayCardBalanceDataResult = Readonly<{
  data: PayCardBalanceData;
  /** True once data is ready and the persisted filter was healed away from the host value. */
  shouldResetFilter: boolean;
}>;

// Builds the filter options and aggregates the balance in one place so both apps
// only supply their portfolio source and formatters.
export function buildPayCardBalanceData({
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
}: BuildPayCardBalanceDataParams): BuildPayCardBalanceDataResult {
  const filterOptions = buildBalanceFilterOptions({
    stablecoins,
    defaultStablecoins,
    allLabel,
    formatFiat,
    formatCrypto,
  });

  const data = aggregatePayCardBalance({
    stablecoins,
    filter,
    isLoading,
    isError,
    filterOptions,
    formatCountervalue,
    onConfirmFilter,
    onTrackEvent,
  });

  const shouldResetFilter = !isLoading && !isError && data.filter !== filter;

  return { data, shouldResetFilter };
}
