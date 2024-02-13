import { useSelector } from "react-redux";
import type {
  Account,
  AccountLike,
  AccountLikeArray,
  PortfolioRange,
  SubAccount,
} from "@ledgerhq/types-live";
import type { TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  useBalanceHistoryWithCountervalue as useBalanceHistoryWithCountervalueCommon,
  useCurrencyPortfolio as useCurrencyPortfolioCommon,
  usePortfolioThrottled,
} from "@ledgerhq/live-common/portfolio/v2/react";
import { GetPortfolioOptionsType } from "@ledgerhq/live-common/portfolio/v2/index";
import {
  selectedTimeRangeSelector,
  counterValueCurrencySelector,
  blacklistedTokenIdsSelector,
} from "../reducers/settings";
import { accountsSelector } from "../reducers/accounts";
import { listSubAccounts, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useMemo } from "react";

export function useBalanceHistoryWithCountervalue({
  account,
  range,
}: {
  account: AccountLike;
  range: PortfolioRange;
}) {
  const accountFiltered = useAccount(account);
  const to = useSelector(counterValueCurrencySelector);
  return useBalanceHistoryWithCountervalueCommon({
    account: accountFiltered,
    range,
    to,
  });
}

export function usePortfolioAllAccounts(options?: GetPortfolioOptionsType) {
  const to = useSelector(counterValueCurrencySelector);
  const accounts = useAccounts();
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
  const accountsFiltered = useAccounts(accounts);
  const to = useSelector(counterValueCurrencySelector);
  const range = useSelector(selectedTimeRangeSelector);
  return usePortfolioThrottled({
    accounts: accountsFiltered,
    range,
    to,
    options,
  });
}

export function useCurrencyPortfolio({
  currency,
  range,
}: {
  currency: CryptoCurrency | TokenCurrency;
  range: PortfolioRange;
}) {
  const accounts = useAccounts();
  const to = useSelector(counterValueCurrencySelector);
  return useCurrencyPortfolioCommon({
    accounts: accounts as Account[],
    range,
    to,
    currency,
  });
}

export function useAccounts(localAccounts: AccountLikeArray = []): AccountLikeArray {
  const accounts = useSelector(accountsSelector);
  const accountsToUse = localAccounts.length ? localAccounts : accounts;

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);
  const filteredAccounts = accountsToUse.map(acc => {
    const subAccounts = filterSubAccounts(listSubAccounts(acc), blacklistedTokenIdsSet);
    return { ...acc, subAccounts };
  });

  return filteredAccounts;
}

export function useAccount(account: AccountLike) {
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const subAccounts = filterSubAccounts(listSubAccounts(account), blacklistedTokenIdsSet);
  return { ...account, subAccounts };
}

export function filterSubAccounts(subAccounts: SubAccount[], blacklistedTokenIdsSet: Set<string>) {
  return subAccounts.filter(
    subAccount => !blacklistedTokenIdsSet.has(getAccountCurrency(subAccount).id),
  );
}
