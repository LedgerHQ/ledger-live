import { PAY_CARD_BALANCE_FILTER_ALL } from "@domain/entity-pay-card";
import { tickerForFilter } from "./buildBalanceFilterOptions";
import { resolveSelection } from "./resolveSelection";
import type {
  PayCardBalanceData,
  PayCardBalanceStatus,
  PayCardPortfolioPort,
  PayCardStablecoin,
} from "../types";

// Filters stablecoins by the active filter, sums their
// countervalues and maps the loading/error flags to a single status.
export function aggregatePayCardBalance({
  stablecoins,
  filter,
  isLoading,
  isError,
  filterOptions,
  formatCountervalue,
  onConfirmFilter,
  onTrackEvent,
}: PayCardPortfolioPort): PayCardBalanceData {
  const optionIds = filterOptions.map(option => option.id);
  const effectiveFilter = resolveSelection(filter, optionIds);

  // Defaults (USDC/USDT) are keyed by market id; held rows may use a different currencyId.
  // Match by ticker so the filtered total stays correct across those ids, falling back to id.
  const ticker =
    effectiveFilter === PAY_CARD_BALANCE_FILTER_ALL
      ? undefined
      : tickerForFilter(effectiveFilter, filterOptions);

  const matchesFilter = ({ currency }: PayCardStablecoin): boolean => {
    if (effectiveFilter === PAY_CARD_BALANCE_FILTER_ALL) {
      return true;
    }
    if (ticker == null) {
      return currency.id === effectiveFilter;
    }
    return currency.ticker.toUpperCase() === ticker.toUpperCase();
  };

  const stableBalance = stablecoins
    .filter(matchesFilter)
    .reduce((total, { value }) => total + value, 0);

  const hasBalance = stablecoins.some(({ value }) => value > 0);

  let status: PayCardBalanceStatus = "ready";
  if (isError) {
    status = "error";
  } else if (isLoading) {
    status = "loading";
  }

  return {
    status,
    stableBalance,
    filter: effectiveFilter,
    hasBalance,
    filterOptions,
    formatCountervalue,
    onConfirmFilter,
    onTrackEvent,
  };
}
