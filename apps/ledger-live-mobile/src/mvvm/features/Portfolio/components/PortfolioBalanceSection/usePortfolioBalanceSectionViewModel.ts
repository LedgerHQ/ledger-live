import { useEffect, useMemo, useRef, useState } from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "~/context/hooks";
import { usePortfolioAllAccounts } from "~/hooks/portfolio";
import { useToggleDiscreetMode } from "~/hooks/useToggleDiscreetMode";
import { selectIsRefreshing, selectSyncPhase } from "~/reducers/portfolioRefresh";
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
  const syncPhase = useSelector(selectSyncPhase);

  const { countervalueChange, balanceHistory, balanceAvailable: rawBalanceAvailable } = portfolio;
  const lastItem = balanceHistory[balanceHistory.length - 1];
  const latestBalance = lastItem?.value ?? 0;
  const unit = counterValueCurrency.units[0];

  const isSyncing = shouldDisplayBalanceRefreshRework && syncPhase === "syncing";

  // Sticky balanceAvailable: stays false while syncing so the shimmer covers
  // the entire cycle. Only flips to true once sync settles AND data is ready.
  const [balanceUnavailable, setBalanceUnavailable] = useState(
    shouldDisplayBalanceRefreshRework ? !rawBalanceAvailable || isSyncing : !rawBalanceAvailable,
  );
  useEffect(() => {
    if (!shouldDisplayBalanceRefreshRework) {
      setBalanceUnavailable(!rawBalanceAvailable);
      return;
    }
    if (!rawBalanceAvailable) {
      setBalanceUnavailable(true);
    } else if (syncPhase !== "syncing") {
      setBalanceUnavailable(false);
    }
  }, [rawBalanceAvailable, syncPhase, shouldDisplayBalanceRefreshRework]);

  const balanceAvailable = !balanceUnavailable;

  const frozenBalanceRef = useRef(latestBalance);
  useEffect(() => {
    if (syncPhase !== "syncing") {
      frozenBalanceRef.current = latestBalance;
    }
  }, [syncPhase, latestBalance]);

  const balance = isSyncing ? frozenBalanceRef.current : latestBalance;

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
    ? !balanceAvailable || isSyncing
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
