import { PAY_CARD_BALANCE_FILTER_ALL } from "../state";
import { tickerForFilter } from "./buildBalanceFilterOptions";
import { resolveSelection } from "./resolveSelection";
import type { BalanceData, BalanceStatus, PortfolioPort, Stablecoin } from "../types";

// Filters the displayed total, maps status, and whether any holding is funded.
export function aggregateBalance({
  stablecoins,
  filter,
  isLoading,
  isError,
  filterOptions,
  formatCountervalue,
  onConfirmFilter,
  onTrackEvent,
}: PortfolioPort): BalanceData {
  const optionIds = filterOptions.map(option => option.id);
  const effectiveFilter = resolveSelection(filter, optionIds);

  // Defaults (USDC/USDT) are keyed by market id; held rows may use a different currencyId.
  // Match by ticker so the filtered total stays correct across those ids, falling back to id.
  const ticker =
    effectiveFilter === PAY_CARD_BALANCE_FILTER_ALL
      ? undefined
      : tickerForFilter(effectiveFilter, filterOptions);

  const matchesFilter = ({ currency }: Stablecoin): boolean => {
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

  let status: BalanceStatus = "ready";
  if (isError) {
    status = "error";
  } else if (isLoading) {
    status = "loading";
  }

  return {
    status,
    stableBalance,
    hasBalance: stablecoins.some(item => item.value > 0 || item.balance > 0),
    filter: effectiveFilter,
    filterOptions,
    formatCountervalue,
    onConfirmFilter,
    onTrackEvent,
  };
}
