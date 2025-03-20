import { useSelector } from "react-redux";
import { DefaultAccountSwapParamList } from "../../types";
import { walletSelector } from "~/reducers/wallet";
import { accountsSelector } from "~/reducers/accounts";
import { useMemo } from "react";

import * as walletApi from "@ledgerhq/live-common/wallet-api/converters";

type SwapLiveUrlParams = {
  fromAccountId?: string;
  fromToken?: string;
  amountFrom?: string;
};

export const useTranslateToSwapAccount = (
  params: DefaultAccountSwapParamList | null,
): SwapLiveUrlParams => {
  const walletState = useSelector(walletSelector);
  const currentAccounts = useSelector(accountsSelector);

  return useMemo(() => {
    const newParams: SwapLiveUrlParams = {};

    if (!params) {
      return {};
    }

    // A specific account was given
    if (params.defaultAccount || params.account) {
      newParams.fromAccountId = walletApi.accountToWalletAPIAccount(
        walletState,
        params.defaultAccount || params.account,
        params?.defaultParentAccount || params.account,
      ).id;

      return newParams;
    }

    // No account was given, but a currency was
    if (params.defaultCurrency || params.currency) {
      const currency = walletApi.currencyToWalletAPICurrency(
        params.defaultCurrency || params.currency,
      );

      // Lets find an account that matches the given currency
      const firstAccount = currentAccounts.find(account => account.currency.id === currency.id);

      // Lets match a token that matches the given currency
      const firstToken = currentAccounts
        .flatMap(account => (account.subAccounts?.length ? account.subAccounts : []))
        .find(subAccount => subAccount.token.id === currency.id);

      // We found an account that matches the token (more specific use case)
      if (firstToken) {
        newParams.fromToken = firstToken.token.id;
        return newParams;
      }

      // We didn't find a token, but we found an account that matches the currency
      if (firstAccount) {
        newParams.fromAccountId = walletApi.accountToWalletAPIAccount(
          walletState,
          firstAccount,
          params.defaultParentAccount,
        ).id;
      }

      return newParams;
    }

    return {};
  }, [params, walletState, currentAccounts]);
};
