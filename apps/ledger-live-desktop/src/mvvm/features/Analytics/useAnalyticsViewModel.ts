import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { usePortfolioBalanceDisplayState } from "LLD/hooks/usePortfolioBalanceDisplayState";
import type { AnalyticsViewModel } from "./types";

export default function useAnalyticsViewModel(): AnalyticsViewModel {
  const navigate = useNavigate();
  const counterValue = useSelector(counterValueCurrencySelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const { shouldDisplayGraphRework, shouldDisplayAssetSection } =
    useWalletFeaturesConfig("desktop");
  const { balanceInfo } = usePortfolioBalanceDisplayState();

  const navigateToDashboard = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return {
    navigateToDashboard,
    counterValue,
    selectedTimeRange,
    balanceInfo,
    shouldDisplayGraphRework,
    shouldDisplayAssetSection,
  };
}
