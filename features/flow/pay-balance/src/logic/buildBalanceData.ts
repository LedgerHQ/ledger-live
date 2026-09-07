import type { Unit } from "@domain/entity-currency-unit";
import type { BalanceFilter } from "../state";
import { aggregateBalance } from "./aggregateBalance";
import {
  buildBalanceFilterOptions,
  type DefaultStablecoin,
  type StablecoinItem,
} from "./buildBalanceFilterOptions";
import type { FormattedValue, BalanceData } from "../types";

export type BuildBalanceDataParams = Readonly<{
  stablecoins: readonly StablecoinItem[];
  defaultStablecoins: readonly DefaultStablecoin[];
  filter: BalanceFilter;
  isLoading: boolean;
  isError: boolean;
  allLabel: string;
  formatFiat: (value: number) => string;
  formatCrypto: (unit: Unit, balance: number) => string;
  formatCountervalue: (value: number) => FormattedValue;
  onConfirmFilter: (filter: BalanceFilter) => void;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
}>;

export type BuildBalanceDataResult = Readonly<{
  data: BalanceData;
  /** True once data is ready and the persisted filter was healed away from the host value. */
  shouldResetFilter: boolean;
}>;

// Builds the filter options and aggregates the balance in one place so both apps
// only supply their portfolio source and formatters.
export function buildBalanceData({
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
}: BuildBalanceDataParams): BuildBalanceDataResult {
  const filterOptions = buildBalanceFilterOptions({
    stablecoins,
    defaultStablecoins,
    allLabel,
    formatFiat,
    formatCrypto,
  });

  const data = aggregateBalance({
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
