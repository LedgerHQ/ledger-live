import { useEffect, useMemo, useRef, useState } from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "~/context/hooks";
import { useToggleDiscreetMode } from "~/hooks/useToggleDiscreetMode";
import { selectIsRefreshing } from "~/reducers/portfolioRefresh";
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
  const isRefreshing = useSelector(selectIsRefreshing);

  const { portfolio, balanceAvailable: rawBalanceAvailable, syncPhase } = usePortfolioBalance();

  const { countervalueChange, balanceHistory } = portfolio;
  const lastItem = balanceHistory[balanceHistory.length - 1];
  const latestBalance = lastItem?.value ?? 0;
  const unit = counterValueCurrency.units[0];

  // Sticky balanceAvailable: stays false while syncing so the shimmer covers
  // the entire cycle (Skeleton -> Animate balance, no shimmer).
  const [balanceUnavailable, setBalanceUnavailable] = useState(!rawBalanceAvailable);
  useEffect(() => {
    if (!rawBalanceAvailable) {
      setBalanceUnavailable(true);
    } else if (syncPhase !== "syncing") {
      setBalanceUnavailable(false);
    }
  }, [rawBalanceAvailable, syncPhase]);

  const balanceAvailable = !balanceUnavailable;

  const frozenBalanceRef = useRef(latestBalance);
  useEffect(() => {
    if (syncPhase !== "syncing") {
      frozenBalanceRef.current = latestBalance;
    }
  }, [syncPhase, latestBalance]);

  const shouldFreezeBalance = shouldDisplayBalanceRefreshRework && syncPhase === "syncing";
  const balance = shouldFreezeBalance ? frozenBalanceRef.current : latestBalance;

  const state: PortfolioBalanceState = useMemo(() => {
    if (isReadOnlyMode) {
      return "noSigner";
    }
    if (!showAssets) {
      return "noAccounts";
    }
    return "normal";
  }, [isReadOnlyMode, showAssets]);

  const isLoading = shouldDisplayBalanceRefreshRework
    ? syncPhase === "syncing"
    : !rawBalanceAvailable || isRefreshing;

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
