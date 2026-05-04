import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { selectPortfolioBalanceDisplay } from "~/reducers/portfolioBalanceDisplay";

/**
 * Read-only hook that exposes the shared portfolio balance display state.
 *
 * Portfolio ViewModel is the single writer (via setPortfolioBalanceDisplay).
 * Both the portfolio and analytics screens consume this hook so they always
 * show the same balance value and loading state, regardless of when each
 * screen mounts relative to the sync lifecycle.
 */
export function usePortfolioBalanceForDisplay() {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const { displayedBalance, isLoading, isBalanceAvailable } = useSelector(
    selectPortfolioBalanceDisplay,
  );

  return {
    displayedBalance,
    isLoading,
    isBalanceAvailable,
    unit: counterValueCurrency.units[0],
  };
}
