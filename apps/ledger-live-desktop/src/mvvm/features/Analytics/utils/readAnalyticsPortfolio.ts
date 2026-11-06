import type { ReadAnalyticsPortfolio } from "@features/flow-account-analytics";
import type { CounterValuesState } from "@domain/entity-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import type { AccountLike } from "@ledgerhq/types-live";
import { getPortfolio } from "@ledgerhq/live-common/portfolio/portfolio";
import { resolveAnalyticsValueChange } from "@ledgerhq/wallet-analytics";

export function createReadAnalyticsPortfolio(
  countervalues: CounterValuesState,
  fiat: Currency,
): ReadAnalyticsPortfolio<AccountLike> {
  return (positions, range) => {
    const accounts = [...positions];
    const portfolio = getPortfolio(accounts, range, countervalues, fiat, {
      flattenSourceAccounts: false,
    });
    return {
      history: portfolio.balanceHistory.map(point => ({
        timestamp: point.date.getTime(),
        amount: point.value,
      })),
      positionIdsWithHistory: portfolio.availableAccounts.map(account => account.id),
      readVariation: currentBalance => {
        const variation = resolveAnalyticsValueChange({
          selectedTimeRange: range,
          accounts,
          currentBalance,
          portfolio,
          cvState: countervalues,
          counterValue: fiat,
        });
        return { amount: variation.value, ratio: variation.percentage ?? null };
      },
    };
  };
}
