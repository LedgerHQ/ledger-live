import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { useCountervaluesCache } from "@features/platform-market-countervalues";
import { accountsSelector } from "~/reducers/accounts";
import { counterValueCurrencySelector, selectedTimeRangeSelector } from "~/reducers/settings";
import { usePortfolioAllAccounts } from "~/hooks/portfolio";
import { usePortfolioBalanceForDisplay } from "LLM/hooks/usePortfolioBalanceForDisplay";
import { resolveAnalyticsValueChange } from "@ledgerhq/wallet-analytics";
import type { ChartSectionViewModel } from "./types";
import { useChartSectionModel } from "./useChartSectionModel";

/** The Portfolio-wide chart: every account and the balance shown on the Portfolio. */
export function useChartSectionViewModel(): ChartSectionViewModel {
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const accounts = useSelector(accountsSelector);
  const countervalues = useCountervaluesCache();
  const portfolio = usePortfolioAllAccounts();
  const { displayedBalance, isBalanceAvailable } = usePortfolioBalanceForDisplay();

  const valueChange = useMemo(
    () =>
      resolveAnalyticsValueChange({
        selectedTimeRange,
        accounts,
        currentBalance: displayedBalance,
        portfolio,
        cvState: countervalues,
        counterValue,
      }),
    [selectedTimeRange, accounts, displayedBalance, portfolio, countervalues, counterValue],
  );

  const { prices, timestamps } = useMemo(() => {
    const history = portfolio.balanceHistory;
    return {
      prices: history.map(point => point.value),
      timestamps: history.map(point => point.date.getTime()),
    };
  }, [portfolio.balanceHistory]);

  return useChartSectionModel({
    prices,
    timestamps,
    valueChange,
    isVariationAvailable: isBalanceAvailable,
    isChartLoading: !isBalanceAvailable,
  });
}
