import { useSelector } from "react-redux";
import { DefaultAccountSwapParamList } from "../../types";
import { walletSelector } from "~/reducers/wallet";
import { accountsSelector } from "~/reducers/accounts";
import { useMemo } from "react";

import * as walletApi from "@ledgerhq/live-common/wallet-api/converters";

type SwapLiveUrlParams = {
  fromAccountId?: string;
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
    if (params.defaultAccount) {
      newParams.fromAccountId = walletApi.accountToWalletAPIAccount(
        walletState,
        params.defaultAccount,
        params?.defaultParentAccount,
      ).id;
      return newParams;
    }

    // No account was given, but a currency was
    // We use the first account found of the given currency
    if (params.defaultCurrency) {
      const currency = walletApi.currencyToWalletAPICurrency(params.defaultCurrency);
      const firstAccount = currentAccounts.find(account => account.currency.id === currency.id);

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
