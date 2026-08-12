import { PAY_CARD_BALANCE_FILTER_ALL } from "@domain/entity-pay-card";
import { resolveSelection } from "./resolveSelection";
import type { PayCardBalanceData, PayCardBalanceStatus, PayCardPortfolioPort } from "./types";

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
  const stableBalance = stablecoins
    .filter(
      ({ currency }) =>
        effectiveFilter === PAY_CARD_BALANCE_FILTER_ALL || currency.id === effectiveFilter,
    )
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
