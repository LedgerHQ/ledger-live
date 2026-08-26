import { useMemo } from "react";
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

  const { portfolio, syncPhase, isCvPending } = usePortfolioBalance();

  const { countervalueChange, balanceHistory } = portfolio;
  const lastItem = balanceHistory[balanceHistory.length - 1];
  const latestBalance = lastItem?.value ?? 0;
  const unit = counterValueCurrency.units[0];

  const effectiveLatestBalance = usePersistedPortfolioBalance(
    latestBalance,
    syncPhase,
    counterValueCurrency.ticker,
    portfolio.countervalueComplete,
  );

  const isCountervalueComplete = portfolio.countervalueComplete;
  const effectiveRawBalanceAvailable = effectiveLatestBalance !== undefined;

  const {
    balanceAvailable,
    displayedBalance,
    isLoading: effectiveIsLoading,
  } = useBalanceSyncState({
    rawBalanceAvailable: effectiveRawBalanceAvailable,
    syncPhase,
    latestBalance: effectiveLatestBalance ?? 0,
    shouldFreezeOnSync: true,
    cvPending: isCvPending,
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
    state === "normal" && isCountervalueComplete && (balanceAvailable || effectiveIsLoading);

  return {
    state,
    balance: displayedBalance,
    countervalueChange,
    unit,
    isBalanceAvailable: balanceAvailable,
    isCountervalueComplete,
    isAnalyticPillVisible,
    isLoading: effectiveIsLoading,
    onToggleDiscreetMode: toggleDiscreetMode,
  };
};
