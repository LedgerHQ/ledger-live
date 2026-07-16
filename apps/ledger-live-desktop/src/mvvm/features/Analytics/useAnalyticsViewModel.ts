import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { usePortfolioBalanceDisplayState } from "LLD/hooks/usePortfolioBalanceDisplayState";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { resolveAnalyticsValueChange } from "@ledgerhq/wallet-analytics";
import type { AnalyticsViewModel } from "./types";

export default function useAnalyticsViewModel(): AnalyticsViewModel {
  const navigate = useNavigate();
  const counterValue = useSelector(counterValueCurrencySelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const accounts = useSelector(accountsSelector);
  const cvState = useCountervaluesState();
  const { shouldDisplayAssetSection, shouldDisplayPnl: isPnlFlagOn } =
    useWalletFeaturesConfig("desktop");
  const {
    balanceInfo: syncBalanceInfo,
    portfolio,
    isLoading,
  } = usePortfolioBalanceDisplayState({ legacyRange: true });

  const shouldDisplayPnl = isPnlFlagOn && accounts.length > 0;

  const valueChange = useMemo(
    () =>
      resolveAnalyticsValueChange({
        selectedTimeRange,
        accounts,
        currentBalance: syncBalanceInfo.totalBalance,
        portfolio,
        cvState,
        counterValue,
      }),
    [selectedTimeRange, accounts, syncBalanceInfo.totalBalance, portfolio, cvState, counterValue],
  );

  const balanceInfo = useMemo(
    () => ({
      ...syncBalanceInfo,
      valueChange,
    }),
    [syncBalanceInfo, valueChange],
  );

  const navigateToDashboard = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return {
    navigateToDashboard,
    counterValue,
    selectedTimeRange,
    balanceInfo,
    portfolio,
    isLoading,
    shouldDisplayAssetSection,
    shouldDisplayPnl,
  };
}
