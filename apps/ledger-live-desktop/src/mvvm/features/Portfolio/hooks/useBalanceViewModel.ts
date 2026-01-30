import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { usePortfolio as usePortfolioRaw } from "@ledgerhq/live-countervalues-react/portfolio";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
  localeSelector,
  discreetModeSelector,
} from "~/renderer/reducers/settings";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { useAccountStatus } from "LLD/hooks/useAccountStatus";
import { BalanceViewModelResult } from "../components/Balance/types";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import { useNavigate } from "react-router";
import BigNumber from "bignumber.js";

const NEW_FLOW_RANGE = "day" as const;

interface UseBalanceViewModelOptions {
  readonly useLegacyRange?: boolean;
}

export const useBalanceViewModel = (
  options: UseBalanceViewModelOptions = {},
): BalanceViewModelResult => {
  const { useLegacyRange = false } = options;
  const navigate = useNavigate();
  const accounts = useSelector(accountsSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const { hasFunds } = useAccountStatus();

  const range = useLegacyRange ? selectedTimeRange : NEW_FLOW_RANGE;

  const portfolio = usePortfolioRaw({
    accounts,
    range,
    to: counterValue,
  });

  const latestBalanceValue =
    portfolio.balanceHistory[portfolio.balanceHistory.length - 1]?.value ?? 0;
  const unit = counterValue.units[0];
  const isAvailable = portfolio.balanceAvailable;
  const valueChange = portfolio.countervalueChange;

  const navigateToAnalytics = useCallback(() => navigate("/analytics"), [navigate]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
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
    balance: latestBalanceValue,
    formatter,
    discreet,
    valueChange,
    isAvailable,
    navigateToAnalytics,
    handleKeyDown,
    hasFunds,
  };
};
