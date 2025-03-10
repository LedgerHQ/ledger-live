/**
 * In order to avoid breaking compatibility with "old" swap, When we load the
 * swap-live-app we translate the current properties into their new names
 * e.g.:
 *  defaultAccount -> fromAccountId
 */

import { useMemo } from "react";
import { DefaultAccountSwapParamList } from "../../types";
import { useSelector } from "react-redux";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import { walletSelector } from "~/reducers/wallet";

type SwapLiveUrlParams = {
  fromAccountId?: string;
  amountFrom?: string;
};

export const useSwapLiveAppTranslateUrlParams = (
  params: DefaultAccountSwapParamList,
): SwapLiveUrlParams => {
  const walletState = useSelector(walletSelector);

  return useMemo(() => {
    const newParams: SwapLiveUrlParams = {};

    if (params.defaultAccount) {
      newParams.fromAccountId = accountToWalletAPIAccount(
        walletState,
        params.defaultAccount,
        params?.defaultParentAccount,
      ).id;
    }

    return newParams;
  }, [params, walletState]);
};
