/**
 * In order to avoid breaking compatibility with "old" swap, When we load the
 * swap-live-app we translate the current properties into their new names
 * e.g.:
 *  defaultAccount -> fromAccountId
 */

import { useMemo } from "react";
import { DefaultAccountSwapParamList } from "../../types";

type SwapLiveUrlParams = {
  fromAccountId?: string;
  amountFrom?: string;
};

export const useSwapLiveAppTranslateUrlParams = (
  params: DefaultAccountSwapParamList,
): SwapLiveUrlParams => {
  return useMemo(() => {
    const newParams: SwapLiveUrlParams = {};
    if (params.defaultAccount) {
      newParams.fromAccountId = params.defaultAccount?.id;
    }
    return newParams;
  }, [params]);
};
