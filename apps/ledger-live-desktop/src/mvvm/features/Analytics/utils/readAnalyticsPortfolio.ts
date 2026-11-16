import type { ReadAnalyticsPortfolio } from "@features/flow-account-analytics";
import type { CounterValuesState } from "@domain/entity-market-countervalues";
import type { AccountLike } from "@ledgerhq/types-live";
import { getPortfolio } from "@ledgerhq/live-common/portfolio/portfolio";
import { resolveAnalyticsValueChange } from "@ledgerhq/wallet-analytics";

export const readAnalyticsPortfolio: ReadAnalyticsPortfolio<AccountLike, CounterValuesState> = (
  positions,
  range,
  countervalues,
  fiat,
) => {
  const accounts = [...positions];
  const portfolio = getPortfolio(accounts, range, countervalues, fiat, {
    flattenSourceAccounts: false,
  });
  return {
    balanceHistory: portfolio.balanceHistory,
    availableAccounts: portfolio.availableAccounts,
    readVariation: currentBalance =>
      resolveAnalyticsValueChange({
        selectedTimeRange: range,
        accounts,
        currentBalance,
        portfolio,
        cvState: countervalues,
        counterValue: fiat,
      }),
  };
};
