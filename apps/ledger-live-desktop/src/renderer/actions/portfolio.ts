import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { AccountLike, PortfolioRange } from "@ledgerhq/types-live";
import {
  usePortfolio as usePortfolioRaw,
  useBalanceHistoryWithCountervalue as useBalanceHistoryWithCountervalueRaw,
} from "@ledgerhq/live-common/portfolio/portfolioReact";
import { filterAccountsExcludingBlacklisted } from "@ledgerhq/live-common/account/filterAccountsExcludingBlacklisted";
import {
  blacklistedTokenIdsSelector,
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { accountsSelector } from "./../reducers/accounts";

// provide redux states via custom hook wrapper

export function useBalanceHistoryWithCountervalue({
  account,
  range,
}: {
  account: AccountLike;
  range: PortfolioRange;
}) {
  const to = useSelector(counterValueCurrencySelector);
  return useBalanceHistoryWithCountervalueRaw({
    account,
    range,
    to,
  });
}
export function usePortfolio() {
  const to = useSelector(counterValueCurrencySelector);
  const accounts = useSelector(accountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const range = useSelector(selectedTimeRangeSelector);
  const hasBlacklistedAssets = blacklistedTokenIds.length > 0;
  const visibleAccounts = useMemo(
    () =>
      hasBlacklistedAssets
        ? filterAccountsExcludingBlacklisted(accounts, blacklistedTokenIds)
        : accounts,
    [accounts, blacklistedTokenIds, hasBlacklistedAssets],
  );
  return usePortfolioRaw({
    accounts: visibleAccounts,
    range,
    to,
    options: hasBlacklistedAssets ? { flattenSourceAccounts: false } : undefined,
  });
}
