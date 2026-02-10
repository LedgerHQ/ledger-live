import { useSelector } from "~/context/hooks";
import { useMemo } from "react";

import * as walletApi from "@ledgerhq/live-common/wallet-api/converters";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import { walletSelector } from "~/reducers/wallet";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";

import { DefaultAccountSwapParamList } from "../../types";
import type { AccountLike, TokenAccount } from "@ledgerhq/types-live";

type SwapLiveUrlParams = {
  toAccountId?: string;
  toTokenId?: string;
  amountFrom?: string;
  affiliate?: string;
  toCurrencyId?: string;
  fromPath?: string;
};

const isTokenAccount = (account: AccountLike | TokenAccount): account is TokenAccount =>
  (account as TokenAccount).token !== undefined;

export const useTranslateToSwapAccount = (
  params: DefaultAccountSwapParamList | null,
): SwapLiveUrlParams => {
  const walletState = useSelector(walletSelector);

  return useMemo(() => {
    const newParams: SwapLiveUrlParams = {};

    if (!params) {
      return {};
    }

    const defaultAccount = params.defaultAccount;
    const defaultCurrency = params.defaultCurrency;

    if (params.fromPath) newParams.fromPath = params.fromPath;
    if (params.affiliate) newParams.affiliate = params.affiliate;

    if (defaultAccount) {
      newParams.toAccountId = walletApi.accountToWalletAPIAccount(
        walletState,
        defaultAccount,
        params?.defaultParentAccount,
      ).id;

      if (isTokenAccount(defaultAccount)) {
        const currency = getAccountCurrency(defaultAccount);
        newParams.toTokenId = walletApi.currencyToWalletAPICurrency(currency).id;
      }
      return newParams;
    }

    if (defaultCurrency) {
      if (isTokenCurrency(defaultCurrency)) {
        newParams.toTokenId = defaultCurrency.id;
      } else {
        newParams.toCurrencyId = defaultCurrency.id;
      }
    }

    return newParams;
  }, [params, walletState]);
};
