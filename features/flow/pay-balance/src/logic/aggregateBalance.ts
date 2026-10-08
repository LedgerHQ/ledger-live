import { PAY_CARD_BALANCE_FILTER_ALL } from "../state";
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
}: PortfolioPort): BalanceData {
  const optionIds = filterOptions.map(option => option.id);
  const effectiveFilter = resolveSelection(filter, optionIds);

  const matchesFilter = ({ currency }: Stablecoin): boolean =>
    effectiveFilter === PAY_CARD_BALANCE_FILTER_ALL || currency.id === effectiveFilter;

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
  };
}
