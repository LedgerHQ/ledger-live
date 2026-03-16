import { useMemo } from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useBalanceSyncState } from "@ledgerhq/live-common/bridge/react/index";
import { useSelector } from "~/context/hooks";
import { useToggleDiscreetMode } from "~/hooks/useToggleDiscreetMode";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { usePortfolioBalance } from "LLM/hooks/usePortfolioBalance";
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

  const { portfolio, balanceAvailable: rawBalanceAvailable, syncPhase } = usePortfolioBalance();

  const { countervalueChange, balanceHistory } = portfolio;
  const lastItem = balanceHistory[balanceHistory.length - 1];
  const latestBalance = lastItem?.value ?? 0;
  const unit = counterValueCurrency.units[0];

  const { balanceAvailable, displayedBalance, isLoading } = useBalanceSyncState({
    rawBalanceAvailable,
    syncPhase,
    latestBalance,
    shouldFreezeOnSync: shouldDisplayBalanceRefreshRework,
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

  return {
    state,
    balance: displayedBalance,
    countervalueChange,
    unit,
    isBalanceAvailable: balanceAvailable,
    isLoading,
    shouldDisplayBalanceRefreshRework,
    onToggleDiscreetMode: toggleDiscreetMode,
  };
};
