/**
 * In order to avoid breaking compatibility with "old" swap, When we load the
 * swap-live-app we translate the current properties into their new names
 * e.g.:
 *  defaultAccount -> fromAccountId
 */

import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { useMemo } from "react";

type SwapLiveUrlParams = {
  fromAccountId?: string;
  amountFrom?: string;
};

type Params = {
  defaultAccount?: AccountLike;
  defaultAmount?: BigNumber;
};

export const useSwapLiveAppTranslateUrlParams = (params: Params): SwapLiveUrlParams => {
  return useMemo(() => {
    const newParams: SwapLiveUrlParams = {};
    if (params.defaultAccount) {
      newParams.fromAccountId = params.defaultAccount?.id;
    }
    if (params.defaultAmount) {
      newParams.amountFrom = params.defaultAmount?.toString();
    }
    return newParams;
  }, [params]);
};
