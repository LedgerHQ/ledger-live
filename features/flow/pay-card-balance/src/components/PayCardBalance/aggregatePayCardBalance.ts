import type { PayCardBalanceData, PayCardBalanceStatus, PayCardPortfolioPort } from "./types";

// Shared Pay hero aggregation (LIVE-34898): filters stablecoins by the active filter, sums their
// countervalues and maps the loading/error flags to a single status.
export function aggregatePayCardBalance({
  stablecoins,
  filter,
  isLoading,
  isError,
  formatCountervalue,
}: PayCardPortfolioPort): PayCardBalanceData {
  const stableBalance = stablecoins
    .filter(({ currency }) => filter === "all" || currency.id === filter)
    .reduce((total, { value }) => total + value, 0);

  let status: PayCardBalanceStatus = "ready";
  if (isError) {
    status = "error";
  } else if (isLoading) {
    status = "loading";
  }

  return { status, stableBalance, filter, formatCountervalue };
}
