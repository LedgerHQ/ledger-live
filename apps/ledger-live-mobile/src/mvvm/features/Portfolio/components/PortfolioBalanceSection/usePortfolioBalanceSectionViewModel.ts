import { useMemo } from "react";
import { useToggleDiscreetMode } from "~/hooks/useToggleDiscreetMode";
import { usePortfolioBalanceForDisplay } from "LLM/hooks/usePortfolioBalanceForDisplay";
import {
  PortfolioBalanceState,
  PortfolioBalanceSectionProps,
  UsePortfolioBalanceSectionViewModelResult,
} from "./types";

export const usePortfolioBalanceSectionViewModel = ({
  showAssets,
  isReadOnlyMode,
}: PortfolioBalanceSectionProps): UsePortfolioBalanceSectionViewModelResult => {
  const { toggleDiscreetMode } = useToggleDiscreetMode();
  const { displayedBalance, isLoading, isBalanceAvailable, countervalueChange, unit } =
    usePortfolioBalanceForDisplay();

  const state: PortfolioBalanceState = useMemo(() => {
    if (isReadOnlyMode) {
      return "noSigner";
    }
    if (!showAssets) {
      return "noAccounts";
    }
    return "normal";
  }, [isReadOnlyMode, showAssets]);

  const isAnalyticPillVisible = state === "normal" && (isBalanceAvailable || isLoading);

  return {
    state,
    balance: displayedBalance,
    countervalueChange,
    unit,
    isBalanceAvailable,
    isAnalyticPillVisible,
    isLoading,
    onToggleDiscreetMode: toggleDiscreetMode,
  };
};
