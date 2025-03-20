import { useSelector } from "react-redux";
import { useMemo } from "react";

import * as walletApi from "@ledgerhq/live-common/wallet-api/converters";
import { walletSelector } from "~/reducers/wallet";
import { flattenAccountsSelector } from "~/reducers/accounts";

import { DefaultAccountSwapParamList, DetailsSwapParamList } from "../../types";

type SwapLiveUrlParams = {
  fromAccountId?: string;
  fromToken?: string;
  amountFrom?: string;
};

export const useTranslateToSwapAccount = (
  params: DefaultAccountSwapParamList | DetailsSwapParamList | null,
): SwapLiveUrlParams => {
  const walletState = useSelector(walletSelector);
  const currentAccounts = useSelector(flattenAccountsSelector);

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

      const account = currentAccounts.find(
        account => account.currency?.id === currency.id || account.token?.id === currency.id,
      );

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
