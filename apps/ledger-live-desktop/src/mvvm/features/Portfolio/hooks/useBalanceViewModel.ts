import { useCallback, useEffect, useRef } from "react";
import { useSelector } from "LLD/hooks/redux";
import {
  hasOnboardedDeviceSelector,
  localeSelector,
  discreetModeSelector,
} from "~/renderer/reducers/settings";
import { useAccountStatus } from "LLD/hooks/useAccountStatus";
import { usePortfolioBalanceSync } from "LLD/hooks/usePortfolioBalanceSync";
import { BalanceViewModelResult } from "../components/Balance/types";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import { useNavigate } from "react-router";
import BigNumber from "bignumber.js";
import { track } from "~/renderer/analytics/segment";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "../utils/constants";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

interface UseBalanceViewModelOptions {
  readonly legacyRange?: boolean;
}

export const useBalanceViewModel = (
  options: UseBalanceViewModelOptions = {},
): BalanceViewModelResult => {
  const { shouldDisplayBalanceRefreshRework } = useWalletFeaturesConfig("desktop");
  const { legacyRange = false } = options;
  const navigate = useNavigate();
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const { hasAccount } = useAccountStatus();
  const { portfolio, counterValue, isBalanceLoading, isColdStart, balanceAvailable } =
    usePortfolioBalanceSync({
      legacyRange,
    });

  const latestBalanceValue =
    portfolio.balanceHistory[portfolio.balanceHistory.length - 1]?.value ?? 0;

  const frozenBalanceRef = useRef(latestBalanceValue);
  useEffect(() => {
    if (!isBalanceLoading) {
      frozenBalanceRef.current = latestBalanceValue;
    }
  }, [isBalanceLoading, latestBalanceValue]);
  const shouldFreezeBalance = shouldDisplayBalanceRefreshRework && isBalanceLoading;
  const displayedBalance = shouldFreezeBalance ? frozenBalanceRef.current : latestBalanceValue;

  const unit = counterValue.units[0];
  const valueChange = portfolio.countervalueChange;

  const navigateToAnalytics = useCallback(() => {
    setTrackingSource(PORTFOLIO_TRACKING_PAGE_NAME);

    track("button_clicked", {
      button: "analytics_page",
      page: PORTFOLIO_TRACKING_PAGE_NAME,
    });
    navigate("/analytics");
  }, [navigate]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigateToAnalytics();
      }
    },
    [navigateToAnalytics],
  );

  const formatter = useCallback(
    (value: number): FormattedValue =>
      formatCurrencyUnitFragment(unit, new BigNumber(value), {
        locale,
        showCode: true,
      }),
    [unit, locale],
  );

  return {
    balance: displayedBalance,
    balanceAvailable,
    formatter,
    discreet,
    valueChange,
    navigateToAnalytics,
    handleKeyDown,
    hasAccount,
    hasOnboardedDevice,
    isColdStart,
    shouldDisplayBalanceRefreshRework,
    isLoading: isBalanceLoading,
  };
};
