import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import {
  hasOnboardedDeviceSelector,
  localeSelector,
  discreetModeSelector,
} from "~/renderer/reducers/settings";
import { themeSelector } from "~/renderer/actions/general";
import { useAccountStatus } from "LLD/hooks/useAccountStatus";
import { usePortfolioBalanceDisplayState } from "LLD/hooks/usePortfolioBalanceDisplayState";
import { BalanceViewModelResult } from "../components/Balance/types";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import { useNavigate } from "react-router";
import BigNumber from "bignumber.js";
import { track } from "~/renderer/analytics/segment";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "LLD/utils/constants";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";

interface UseBalanceViewModelOptions {
  readonly legacyRange?: boolean;
}

export const useBalanceViewModel = (
  options: UseBalanceViewModelOptions = {},
): BalanceViewModelResult => {
  const navigate = useNavigate();
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const theme = useSelector(themeSelector);
  const { hasAccount } = useAccountStatus();

  const {
    counterValue,
    displayedBalance,
    balanceAvailable,
    isLoading,
    isColdStart,
    valueChange,
    shouldDisplayBalanceRefreshRework,
  } = usePortfolioBalanceDisplayState(options);

  const unit = counterValue.units[0];

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
    isLoading,
    theme,
  };
};
