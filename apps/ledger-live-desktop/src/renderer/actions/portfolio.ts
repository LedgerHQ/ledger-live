import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { AccountLike, PortfolioRange } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  usePortfolio as usePortfolioRaw,
  useBalanceHistoryWithCountervalue as useBalanceHistoryWithCountervalueRaw,
  useCurrencyPortfolio as useCurrencyPortfolioRaw,
} from "@ledgerhq/live-countervalues-react/portfolio";
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
export function useCurrencyPortfolio({
  currency,
  range,
}: {
  currency: CryptoCurrency | TokenCurrency;
  range: PortfolioRange;
}) {
  const accounts = useSelector(accountsSelector);
  const to = useSelector(counterValueCurrencySelector);
  return useCurrencyPortfolioRaw({
    accounts,
    range,
    to,
    currency,
  });
}
