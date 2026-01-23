import { useSelector } from "LLD/hooks/redux";
import { usePortfolio as usePortfolioRaw } from "@ledgerhq/live-countervalues-react/portfolio";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { BalanceViewModelResult } from "../components/Balance/types";

const NEW_FLOW_RANGE = "day" as const;

interface UseBalanceViewModelOptions {
  readonly useLegacyRange?: boolean;
}

export const useBalanceViewModel = (
  options: UseBalanceViewModelOptions = {},
): BalanceViewModelResult => {
  const { useLegacyRange = false } = options;

  const accounts = useSelector(accountsSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);

  const range = useLegacyRange ? selectedTimeRange : NEW_FLOW_RANGE;

  const portfolio = usePortfolioRaw({
    accounts,
    range,
    to: counterValue,
  });

  const totalBalance = portfolio.balanceHistory[portfolio.balanceHistory.length - 1]?.value ?? 0;
  const unit = counterValue.units[0];
  const isAvailable = portfolio.balanceAvailable;
  const valueChange = portfolio.countervalueChange;
  const currencyTicker = counterValue.ticker;

  return {
    totalBalance,
    valueChange,
    unit,
    isAvailable,
    currencyTicker,
  };
};
