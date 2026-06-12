import { useMemo } from "react";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useBalanceSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { useSelector } from "~/context/hooks";
import { useToggleDiscreetMode } from "~/hooks/useToggleDiscreetMode";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { usePortfolioBalance } from "LLM/hooks/usePortfolioBalance";
import { usePersistedPortfolioBalance } from "./usePersistedPortfolioBalance";
import {
  PortfolioBalanceState,
  PortfolioBalanceSectionProps,
  UsePortfolioBalanceSectionViewModelResult,
} from "./types";

export const usePortfolioBalanceSectionViewModel = ({
  showAssets,
  isReadOnlyMode,
}: PortfolioBalanceSectionProps): UsePortfolioBalanceSectionViewModelResult => {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const { toggleDiscreetMode } = useToggleDiscreetMode();
  const { shouldDisplayBalanceRefreshRework } = useWalletFeaturesConfig("mobile");

  const {
    portfolio,
    balanceAvailable: rawBalanceAvailable,
    syncPhase,
    isCvPending,
  } = usePortfolioBalance();

  const { countervalueChange, balanceHistory } = portfolio;
  const lastItem = balanceHistory[balanceHistory.length - 1];
  const latestBalance = lastItem?.value ?? 0;
  const unit = counterValueCurrency.units[0];

  const effectiveLatestBalance = usePersistedPortfolioBalance(
    latestBalance,
    syncPhase,
    counterValueCurrency.ticker,
  );

  // If MMKV has a cached balance from a previous session, treat it as available
  // immediately so the cached value is shown at cold start instead of a skeleton.
  const effectiveRawBalanceAvailable = rawBalanceAvailable || effectiveLatestBalance > 0;

  const {
    balanceAvailable,
    displayedBalance,
    isLoading: effectiveIsLoading,
  } = useBalanceSyncState({
    rawBalanceAvailable: effectiveRawBalanceAvailable,
    syncPhase,
    latestBalance: effectiveLatestBalance,
    shouldFreezeOnSync: shouldDisplayBalanceRefreshRework,
    cvPending: shouldDisplayBalanceRefreshRework ? isCvPending : undefined,
  });

  const state: PortfolioBalanceState = useMemo(() => {
    if (isReadOnlyMode) {
      return "noSigner";
    }
    if (!showAssets) {
      return "noAccounts";
    }
    return "normal";
  }, [isReadOnlyMode, showAssets]);

  const isAnalyticPillVisible =
    state === "normal" &&
    (balanceAvailable || (shouldDisplayBalanceRefreshRework && effectiveIsLoading));

  return {
    state,
    balance: displayedBalance,
    countervalueChange,
    unit,
    isBalanceAvailable: balanceAvailable,
    isAnalyticPillVisible,
    isLoading: effectiveIsLoading,
    shouldDisplayBalanceRefreshRework,
    onToggleDiscreetMode: toggleDiscreetMode,
  };
};
