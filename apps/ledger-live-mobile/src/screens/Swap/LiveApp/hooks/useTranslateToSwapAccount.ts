import { useSelector } from "react-redux";
import { useMemo } from "react";

import * as walletApi from "@ledgerhq/live-common/wallet-api/converters";
import { walletSelector } from "~/reducers/wallet";
import { flattenAccountsSelector } from "~/reducers/accounts";

import { DefaultAccountSwapParamList, DetailsSwapParamList } from "../../types";
import type { AccountLike, TokenAccount } from "@ledgerhq/types-live";

type SwapLiveUrlParams = {
  fromAccountId?: string;
  fromToken?: string;
  amountFrom?: string;
};

const getHighestBalanceAccount = (accounts: Array<AccountLike | TokenAccount>) => {
  const sorted = [...accounts];
  sorted.sort((a, b) => (a.spendableBalance.lt(b.spendableBalance) ? 1 : -1));
  return sorted[0];
};

export const useTranslateToSwapAccount = (
  params: DefaultAccountSwapParamList,
): SwapLiveUrlParams => {
  const walletState = useSelector(walletSelector);
  const currentAccounts = useSelector(flattenAccountsSelector);

  return useMemo(() => {
    const newParams: SwapLiveUrlParams = {};

    if (!params) {
      return {};
    }

    const defaultAccount = params.defaultAccount || params.accountId;
    const defaultCurrency = params.defaultCurrency || params.currency;

    // A specific account was given
    if (defaultAccount) {
      newParams.fromAccountId = walletApi.accountToWalletAPIAccount(
        walletState,
        defaultAccount,
        params?.defaultParentAccount || params.account,
      ).id;

      return newParams;
    }

    // No account was given, but a currency was
    if (defaultCurrency) {
      const currency = walletApi.currencyToWalletAPICurrency(defaultCurrency);
      const accounts = currentAccounts.filter(
        account => account.currency?.id === currency.id || account.token?.id === currency.id,
      );
      const account = getHighestBalanceAccount(accounts);

      if (account) {
        newParams.fromAccountId = walletApi.accountToWalletAPIAccount(
          walletState,
          account,
          currentAccounts.find(currentAccount => currentAccount.id === account.parentId),
        ).id;
      }

      newParams.fromToken = currency.id;
      return newParams;
    }

    return {};
  }, [params, walletState, currentAccounts]);
};
