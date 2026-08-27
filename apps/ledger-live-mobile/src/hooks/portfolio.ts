import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import type { AccountLike, PortfolioRange } from "@ledgerhq/types-live";
import {
  useBalanceHistoryWithCountervalue as useBalanceHistoryWithCountervalueCommon,
  usePortfolioThrottled,
} from "@ledgerhq/live-countervalues-react/portfolio";
import { GetPortfolioOptionsType } from "@ledgerhq/live-countervalues/portfolio";
import { filterAccountsExcludingBlacklisted } from "@ledgerhq/live-common/account/filterAccountsExcludingBlacklisted";
import {
  blacklistedTokenIdsSelector,
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "../reducers/settings";
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

const EMPTY_PORTFOLIO_ACCOUNTS: AccountLike[] = [];

export function usePortfolioAllAccounts(
  options?: GetPortfolioOptionsType & { range?: PortfolioRange; skip?: boolean },
) {
  const { range, skip, ...portfolioOptions } = options ?? {};
  const to = useSelector(counterValueCurrencySelector);
  const accounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const globalRange = useSelector(selectedTimeRangeSelector);

  const hasBlacklistedAssets = blacklistedTokenIds.length > 0;
  const visibleAccounts = useMemo(() => {
    if (skip) {
      return EMPTY_PORTFOLIO_ACCOUNTS;
    }
    return hasBlacklistedAssets
      ? filterAccountsExcludingBlacklisted(accounts, blacklistedTokenIds)
      : accounts;
  }, [accounts, blacklistedTokenIds, hasBlacklistedAssets, skip]);

  return usePortfolioThrottled({
    accounts: visibleAccounts,
    range: range ?? globalRange,
    to,
    options: hasBlacklistedAssets
      ? { ...portfolioOptions, flattenSourceAccounts: false }
      : portfolioOptions,
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
