import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { usePortfolioAllAccounts } from "~/hooks/portfolio";
import { counterValueCurrencySelector } from "~/reducers/settings";
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
  const portfolio = usePortfolioAllAccounts();

  const { countervalueChange, balanceHistory, balanceAvailable } = portfolio;
  const lastItem = balanceHistory[balanceHistory.length - 1];
  const balance = lastItem?.value ?? 0;
  const unit = counterValueCurrency.units[0];

  const state: PortfolioBalanceState = useMemo(() => {
    if (isReadOnlyMode) {
      return "noSigner";
    }
    if (!showAssets) {
      return "noFund";
    }
    return "normal";
  }, [isReadOnlyMode, showAssets]);

  return {
    state,
    balance,
    countervalueChange,
    unit,
    isBalanceAvailable: balanceAvailable,
  };
};
