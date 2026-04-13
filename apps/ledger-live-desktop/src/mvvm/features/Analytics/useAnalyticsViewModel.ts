import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { usePortfolioBalance } from "LLD/hooks/usePortfolioBalance";
import { useBalanceSyncState } from "@ledgerhq/live-common/bridge/react/index";
import type { AnalyticsViewModel } from "./types";

export default function useAnalyticsViewModel(): AnalyticsViewModel {
  const navigate = useNavigate();
  const counterValue = useSelector(counterValueCurrencySelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const { shouldDisplayGraphRework, shouldDisplayAssetSection, shouldDisplayBalanceRefreshRework } =
    useWalletFeaturesConfig("desktop");

  const { portfolio, balanceAvailable: rawBalanceAvailable, syncPhase } = usePortfolioBalance();

  const latestBalanceValue =
    portfolio.balanceHistory[portfolio.balanceHistory.length - 1]?.value ?? 0;

  const { displayedBalance } = useBalanceSyncState({
    rawBalanceAvailable,
    syncPhase,
    latestBalance: latestBalanceValue,
    shouldFreezeOnSync: shouldDisplayBalanceRefreshRework,
  });

  const navigateToDashboard = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return {
    navigateToDashboard,
    counterValue,
    selectedTimeRange,

    shouldDisplayGraphRework,
    shouldDisplayAssetSection,

    totalBalanceOverride: shouldDisplayGraphRework ? displayedBalance : undefined,
  };
}
