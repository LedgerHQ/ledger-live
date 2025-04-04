import { useState, useCallback, useMemo, useEffect } from "react";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { makeEmptyTokenAccount } from "@ledgerhq/live-common/account/index";
import { CryptoCurrency, CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
export type AccountTuple = {
  account: Account;
  subAccount: TokenAccount | undefined | null;
};
export function getAccountTuplesForCurrency(
  currency: CryptoCurrency | TokenCurrency,
  allAccounts: Account[],
  hideEmpty?: boolean | null,
  accountIds?: Map<string, boolean>,
): AccountTuple[] {
  if (currency.type === "TokenCurrency") {
    return allAccounts
      .filter(account => {
        // not checking subAccounts against accountIds for TokenCurrency
        // because the wallet-api is not able to setup empty accounts
        // for all parentAccounts and currencies we support
        // and we would lose the empty token accounts in the drawer
        return account.currency.id === currency.parentCurrency.id;
      })
      .map(account => ({
        account,
        subAccount:
          (account.subAccounts &&
            account.subAccounts.find(
              (subAcc: TokenAccount) =>
                subAcc.type === "TokenAccount" && subAcc.token.id === currency.id,
            )) ||
          makeEmptyTokenAccount(account, currency),
      }))
      .filter(a => (hideEmpty ? a.subAccount?.balance.gt(0) : true));
  }
  return allAccounts
    .filter(
      account =>
        account.currency.id === currency.id && (accountIds ? accountIds.has(account.id) : true),
    )
    .map(account => ({
      account,
      subAccount: null,
    }))
    .filter(a => (hideEmpty ? a.account?.balance.gt(0) : true));
}
const getIdsFromTuple = (accountTuple: AccountTuple) => ({
  accountId: accountTuple.account ? accountTuple.account.id : null,
  subAccountId: accountTuple.subAccount ? accountTuple.subAccount.id : null,
});
export type UseCurrencyAccountSelectReturnType<
  C extends CryptoOrTokenCurrency = CryptoOrTokenCurrency,
> = {
  availableAccounts: Array<AccountTuple>;
  currency: C | undefined | null;
  account: Account | undefined | null;
  subAccount: TokenAccount | undefined | null;
  setAccount: (account?: Account | null, subAccount?: TokenAccount | null) => void;
  setCurrency: (currency?: C | null) => void;
};
export function useCurrencyAccountSelect({
  allCurrencies,
  allAccounts,
  defaultCurrencyId,
  defaultAccountId,
  hideEmpty,
}: {
  allCurrencies: Array<CryptoCurrency | TokenCurrency>;
  allAccounts: Account[];
  defaultCurrencyId: string | undefined | null;
  defaultAccountId: string | undefined | null;
  hideEmpty?: boolean | null;
}): UseCurrencyAccountSelectReturnType {
  const [state, setState] = useState<{
    currency: CryptoCurrency | TokenCurrency | null | undefined;
    accountId: string | null | undefined;
  }>(() => {
    const currency = defaultCurrencyId
      ? allCurrencies.find(currency => currency.id === defaultCurrencyId)
      : allCurrencies.length > 0
        ? allCurrencies[0]
        : undefined;
    if (!currency) {
      return {
        currency: null,
        accountId: null,
      };
    }
    const availableAccounts = getAccountTuplesForCurrency(currency, allAccounts, hideEmpty);
    const { accountId } = defaultAccountId
      ? {
          accountId: defaultAccountId,
        }
      : availableAccounts.length
        ? getIdsFromTuple(availableAccounts[0])
        : {
            accountId: null,
          };
    return {
      currency,
      accountId,
    };
  });
  const { currency, accountId } = state;
  const setCurrency = useCallback(
    (currency: (CryptoCurrency | undefined | null) | TokenCurrency) => {
      if (currency) {
        const availableAccounts = getAccountTuplesForCurrency(currency, allAccounts, hideEmpty);
        const { accountId } = availableAccounts.length
          ? getIdsFromTuple(availableAccounts[0])
          : {
              accountId: null,
            };
        return setState(currState => ({
          ...currState,
          currency,
          accountId,
        }));
      }
      return setState(currState => ({
        ...currState,
        currency,
        accountId: null,
      }));
    },
    [allAccounts, hideEmpty],
  );
  const setAccount = useCallback((account?: Account | null) => {
    setState(currState => ({
      ...currState,
      accountId: account ? account.id : null,
    }));
  }, []);
  const availableAccounts = useMemo(
    () => (currency ? getAccountTuplesForCurrency(currency, allAccounts, hideEmpty) : []),
    [currency, allAccounts, hideEmpty],
  );
  const { account, subAccount } = useMemo(() => {
    return (
      availableAccounts.find(tuple => (tuple.account ? tuple.account.id === accountId : false)) || {
        account: null,
        subAccount: null,
      }
    );
  }, [availableAccounts, accountId]);
  useEffect(() => {
    if (!accountId && availableAccounts.length > 0) {
      setState(currState => ({
        ...currState,
        accountId: availableAccounts[0].account?.id,
        subAccountId: availableAccounts[0].subAccount ? availableAccounts[0].subAccount.id : null,
      }));
    }
  }, [availableAccounts, accountId]);
  return {
    availableAccounts,
    currency,
    account,
    subAccount,
    setAccount,
    setCurrency,
  };
}
