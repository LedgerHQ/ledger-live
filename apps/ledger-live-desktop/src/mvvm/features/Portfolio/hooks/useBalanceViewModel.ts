import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { usePortfolio as usePortfolioRaw } from "@ledgerhq/live-countervalues-react/portfolio";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { BalanceViewModelResult } from "../components/Balance/types";
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

  const range = useLegacyRange ? selectedTimeRange : NEW_FLOW_RANGE;

  const portfolio = usePortfolioRaw({
    accounts,
    range,
    to: counterValue,
  });

  const latestBalanceValue =
    portfolio.balanceHistory[portfolio.balanceHistory.length - 1]?.value ?? 0;
  const totalBalance = new BigNumber(latestBalanceValue);
  const unit = counterValue.units[0];
  const isAvailable = portfolio.balanceAvailable;
  const isFiat = counterValue.type === "FiatCurrency";
  const valueChange = portfolio.countervalueChange;

  const navigateToAnalytics = useCallback(() => navigate("/analytics"), [navigate]);

  return {
    totalBalance,
    valueChange,
    unit,
    isAvailable,
    isFiat,
    navigateToAnalytics,
  };
};
