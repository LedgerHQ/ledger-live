import { useSelector } from "react-redux";
import { useMemo } from "react";

import * as walletApi from "@ledgerhq/live-common/wallet-api/converters";
import { walletSelector } from "~/reducers/wallet";

import { DefaultAccountSwapParamList } from "../../types";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";

type SwapLiveUrlParams = {
  fromAccountId?: string;
  fromToken?: string;
  amountFrom?: string;
};

const isTokenAccount = (account: AccountLike | TokenAccount): account is TokenAccount =>
  (account as TokenAccount).token !== undefined;

const isAccount = (account: AccountLike | undefined): account is Account =>
  !!account && (account as Account).currency !== undefined;

const getHighestBalanceAccount = (accounts: AccountLike[]): AccountLike => {
  const sorted = [...accounts];
  sorted.sort((a, b) => (a.spendableBalance.lt(b.spendableBalance) ? 1 : -1));
  return sorted[0];
};

export const useTranslateToSwapAccount = (
  params: DefaultAccountSwapParamList | null,
  currentAccounts: AccountLike[],
): SwapLiveUrlParams => {
  const walletState = useSelector(walletSelector);

  return useMemo(() => {
    const newParams: SwapLiveUrlParams = {};

    if (!params) {
      return {};
    }

    const defaultAccount = params.defaultAccount;
    // @ts-expect-error params.currency comes from market
    const defaultCurrency = params.defaultCurrency || params.currency;

    // A specific account was given
    if (defaultAccount) {
      newParams.fromAccountId = walletApi.accountToWalletAPIAccount(
        walletState,
        defaultAccount,
        params?.defaultParentAccount,
      ).id;

      return newParams;
    }

    // No account was given, but a currency was
    if (defaultCurrency) {
      const currency = walletApi.currencyToWalletAPICurrency(defaultCurrency);
      const accounts = currentAccounts.filter(account =>
        isTokenAccount(account)
          ? account.token.id === currency.id
          : account.currency?.id === currency.id,
      );
      const account = getHighestBalanceAccount(accounts);

      if (account) {
        const parentAccount = currentAccounts.find(currentAccount =>
          isTokenAccount(account) ? currentAccount.id === account.parentId : false,
        );

        newParams.fromAccountId = walletApi.accountToWalletAPIAccount(
          walletState,
          account,
          isAccount(parentAccount) ? parentAccount : undefined,
        ).id;
      }

      newParams.fromToken = currency.id;
      return newParams;
    }

    return {};
  }, [params, walletState, currentAccounts]);
};
