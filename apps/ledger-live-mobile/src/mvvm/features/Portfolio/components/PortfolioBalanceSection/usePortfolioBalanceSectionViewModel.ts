import { useMemo } from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "~/context/hooks";
import { usePortfolioAllAccounts } from "~/hooks/portfolio";
import { useToggleDiscreetMode } from "~/hooks/useToggleDiscreetMode";
import { selectIsRefreshing } from "~/reducers/portfolioRefresh";
import { counterValueCurrencySelector } from "~/reducers/settings";
import {
  PortfolioBalanceState,
  PortfolioBalanceSectionProps,
  UsePortfolioBalanceSectionViewModelResult,
} from "./types";

const DEFAULT_RANGE = "day";

export const usePortfolioBalanceSectionViewModel = ({
  showAssets,
  isReadOnlyMode,
}: PortfolioBalanceSectionProps): UsePortfolioBalanceSectionViewModelResult => {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const { toggleDiscreetMode } = useToggleDiscreetMode();
  const portfolio = usePortfolioAllAccounts({ range: DEFAULT_RANGE });
  const { shouldDisplayBalanceRefreshRework } = useWalletFeaturesConfig("mobile");
  const isRefreshing = useSelector(selectIsRefreshing);

  const { countervalueChange, balanceHistory, balanceAvailable } = portfolio;
  const lastItem = balanceHistory[balanceHistory.length - 1];
  const balance = lastItem?.value ?? 0;
  const unit = counterValueCurrency.units[0];

  const state: PortfolioBalanceState = useMemo(() => {
    if (isReadOnlyMode) {
      return "noSigner";
    }
    if (!showAssets) {
      return "noAccounts";
    }
    return "normal";
  }, [isReadOnlyMode, showAssets]);

  const isLoading = !balanceAvailable || isRefreshing;

  return {
    state,
    balance,
    countervalueChange,
    unit,
    isBalanceAvailable: balanceAvailable,
    isLoading,
    shouldDisplayBalanceRefreshRework,
    onToggleDiscreetMode: toggleDiscreetMode,
  };
};
