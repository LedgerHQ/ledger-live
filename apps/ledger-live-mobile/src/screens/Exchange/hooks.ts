import { makeEmptyTokenAccount } from "@ledgerhq/live-common/account/index";
import {
  listCryptoCurrencies,
  listTokens,
} from "@ledgerhq/live-common/currencies/index";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { getAllSupportedCryptoCurrencyIds } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import { RampCatalogEntry } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/types";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import type { Account, SubAccount } from "@ledgerhq/types-live";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { blacklistedTokenIdsSelector } from "../../reducers/settings";

export const useRampCatalogCurrencies = (entries: RampCatalogEntry[]) => {
  const devMode = useEnv("MANAGER_DEV_MODE");
  // fetching all live supported currencies including tokens
  const cryptoCurrencies = useMemo(
    () => listCryptoCurrencies(devMode).concat(listTokens()),
    [devMode],
  );
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  return useMemo(() => {
    const supportedCurrenciesIds = getAllSupportedCryptoCurrencyIds(entries);
    return cryptoCurrencies.filter(
      currency =>
        supportedCurrenciesIds.includes(currency.id) &&
        !blacklistedTokenIds.includes(currency.id),
    );
  }, [blacklistedTokenIds, cryptoCurrencies, entries]);
};
export type AccountTuple = {
  account: Account | null | undefined;
  subAccount: SubAccount | null | undefined;
};
export function getAccountTuplesForCurrency(
  currency: CryptoCurrency | TokenCurrency,
  allAccounts: Account[],
  hideEmpty: boolean | null | undefined,
): AccountTuple[] {
  if (currency.type === "TokenCurrency") {
    return allAccounts
      .filter(account => account.currency.id === currency.parentCurrency.id)
      .map(account => ({
        account,
        subAccount:
          (account.subAccounts &&
            account.subAccounts.find(
              (subAcc: SubAccount) =>
                subAcc.type === "TokenAccount" &&
                subAcc.token.id === currency.id,
            )) ||
          makeEmptyTokenAccount(account, currency),
      }))
      .filter(a => (hideEmpty ? a.subAccount?.balance.gt(0) : true));
  }

  return allAccounts
    .filter(account => account.currency.id === currency.id)
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

export type UseCurrencyAccountSelectReturnType = {
  availableAccounts: Array<AccountTuple>;
  currency: (CryptoCurrency | null | undefined) | TokenCurrency;
  account: (Account | null | undefined) | any;
  subAccount: (SubAccount | null | undefined) | any;
  setAccount: (
    account: Account | null | undefined,
    subAccount: SubAccount | null | undefined,
  ) => void;
  setCurrency: (_: (CryptoCurrency | TokenCurrency) | null | undefined) => void;
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
  defaultCurrencyId: string | null | undefined;
  defaultAccountId: string | null | undefined;
  hideEmpty?: boolean | null | undefined;
}): UseCurrencyAccountSelectReturnType {
  const [state, setState] = useState(() => {
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

    const availableAccounts = getAccountTuplesForCurrency(
      currency,
      allAccounts,
      hideEmpty,
    );
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
    (currency: (CryptoCurrency | null | undefined) | TokenCurrency) => {
      if (currency) {
        const availableAccounts = getAccountTuplesForCurrency(
          currency,
          allAccounts,
          hideEmpty,
        );
        const { accountId } = availableAccounts.length
          ? getIdsFromTuple(availableAccounts[0])
          : {
              accountId: null,
            };
        return setState(currState => ({ ...currState, currency, accountId }));
      }

      return setState(currState => ({
        ...currState,
        currency,
        accountId: null,
      }));
    },
    [allAccounts, hideEmpty],
  );
  const setAccount = useCallback(
    (account: Account | null | undefined, _: SubAccount | null | undefined) => {
      setState(currState => ({
        ...currState,
        accountId: account ? account.id : null,
      }));
    },
    [],
  );
  const availableAccounts = useMemo(
    () =>
      currency
        ? getAccountTuplesForCurrency(currency, allAccounts, hideEmpty)
        : [],
    [currency, allAccounts, hideEmpty],
  );
  const { account, subAccount } = useMemo(
    () =>
      availableAccounts.find(
        tuple =>
          (tuple.account && tuple.account.id === accountId) ||
          (tuple.subAccount && tuple.subAccount.id === accountId),
      ) || {
        account: null,
        subAccount: null,
      },
    [availableAccounts, accountId],
  );
  useEffect(() => {
    if (!accountId && availableAccounts.length > 0) {
      setState(currState => ({
        ...currState,
        accountId:
          availableAccounts[0].account && availableAccounts[0].account.id,
        subAccountId: availableAccounts[0].subAccount
          ? availableAccounts[0].subAccount.id
          : null,
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
