import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import type { AnalyticsViewModel } from "./types";
import { useAllocationData } from "./hooks/useAllocationData";

export default function useAnalyticsViewModel(): AnalyticsViewModel {
  const navigate = useNavigate();
  const counterValue = useSelector(counterValueCurrencySelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const { shouldDisplayGraphRework, shouldDisplayAssetSection } =
    useWalletFeaturesConfig("desktop");

  const navigateToDashboard = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const allocation = useAllocationData();

  return {
    navigateToDashboard,
    counterValue,
    selectedTimeRange,

    shouldDisplayGraphRework,
    shouldDisplayAssetSection,
    allocation,
  };
}
