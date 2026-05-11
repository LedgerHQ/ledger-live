import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { usePortfolioBalance } from "LLD/hooks/usePortfolioBalance";
import type { AnalyticsViewModel } from "./types";

export default function useAnalyticsViewModel(): AnalyticsViewModel {
  const navigate = useNavigate();
  const counterValue = useSelector(counterValueCurrencySelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const { shouldDisplayGraphRework, shouldDisplayAssetSection } =
    useWalletFeaturesConfig("desktop");

  const { portfolio } = usePortfolioBalance();

  const navigateToDashboard = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return {
    navigateToDashboard,
    counterValue,
    selectedTimeRange,
    portfolio,

    shouldDisplayGraphRework,
    shouldDisplayAssetSection,
  };
}
