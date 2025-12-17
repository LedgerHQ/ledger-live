import { useSelector } from "~/context/store";
import type { AccountLike, PortfolioRange } from "@ledgerhq/types-live";
import {
  useBalanceHistoryWithCountervalue as useBalanceHistoryWithCountervalueCommon,
  usePortfolioThrottled,
} from "@ledgerhq/live-countervalues-react/portfolio";
import { GetPortfolioOptionsType } from "@ledgerhq/live-countervalues/portfolio";
import { selectedTimeRangeSelector, counterValueCurrencySelector } from "../reducers/settings";
import { accountsSelector } from "../reducers/accounts";

export function useBalanceHistoryWithCountervalue({
  account,
  range,
}: {
  account: AccountLike;
  range: PortfolioRange;
}) {
  const to = useSelector(counterValueCurrencySelector);
  return useBalanceHistoryWithCountervalueCommon({
    account,
    range,
    to,
  });
}

export function usePortfolioAllAccounts(options?: GetPortfolioOptionsType) {
  const to = useSelector(counterValueCurrencySelector);
  const accounts = useSelector(accountsSelector);
  const range = useSelector(selectedTimeRangeSelector);
  return usePortfolioThrottled({
    accounts,
    range,
    to,
    options,
  });
}

export function usePortfolioForAccounts(
  accounts: AccountLike[],
  options?: GetPortfolioOptionsType,
) {
  const to = useSelector(counterValueCurrencySelector);
  const range = useSelector(selectedTimeRangeSelector);
  return usePortfolioThrottled({
    accounts,
    range,
    to,
    options,
  });
}
