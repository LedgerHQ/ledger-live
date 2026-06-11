import { useEffect } from "react";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useBalanceSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { useSelector, useDispatch } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { setPortfolioBalanceDisplay } from "~/reducers/portfolioBalanceDisplay";
import { usePortfolioBalance } from "LLM/hooks/usePortfolioBalance";
import { usePersistedPortfolioBalance } from "../PortfolioBalanceSection/usePersistedPortfolioBalance";

/**
 * Renderless component — mounts once in WalletTabNavigator and owns the
 * portfolio balance display state for the entire wallet flow.
 *
 * It runs the full computation chain (bridge sync → MMKV persistence →
 * freeze-on-sync) and writes the result to the portfolioBalanceDisplay Redux
 * slice. Both the Portfolio and Analytics screens consume that slice via
 * usePortfolioBalanceForDisplay(), so they always show the same value
 * regardless of which screen mounted first.
 *
 * Moving the computation here (rather than inside the Portfolio ViewModel)
 * means Analytics is never blocked by whether Portfolio has rendered yet —
 * including when arriving via a deep link directly to Analytics.
 */
export function PortfolioBalanceSync(): null {
  const dispatch = useDispatch();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const { shouldDisplayBalanceRefreshRework } = useWalletFeaturesConfig("mobile");

  const {
    portfolio,
    balanceAvailable: rawBalanceAvailable,
    syncPhase,
    isCvPending,
  } = usePortfolioBalance();

  const lastItem = portfolio.balanceHistory[portfolio.balanceHistory.length - 1];
  const latestBalance = lastItem?.value ?? 0;

  const effectiveLatestBalance = usePersistedPortfolioBalance(
    latestBalance,
    syncPhase,
    counterValueCurrency.ticker,
  );

  const effectiveRawBalanceAvailable = rawBalanceAvailable || effectiveLatestBalance > 0;

  const { balanceAvailable, displayedBalance, isLoading } = useBalanceSyncState({
    rawBalanceAvailable: effectiveRawBalanceAvailable,
    syncPhase,
    latestBalance: effectiveLatestBalance,
    shouldFreezeOnSync: shouldDisplayBalanceRefreshRework,
    cvPending: shouldDisplayBalanceRefreshRework ? isCvPending : undefined,
  });

  useEffect(() => {
    dispatch(
      setPortfolioBalanceDisplay({
        displayedBalance,
        isLoading,
        isBalanceAvailable: balanceAvailable,
      }),
    );
  }, [displayedBalance, isLoading, balanceAvailable, dispatch]);

  return null;
}
