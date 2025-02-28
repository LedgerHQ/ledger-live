/**
 * In order to avoid breaking compatibility with "old" swap, When we load the
 * swap-live-app we translate the current properties into their new names
 * e.g.:
 *  defaultAccount -> fromAccountId
 */

import { useMemo } from "react";

export const useSwapLiveAppTranslateUrlParams = (params: Record<string, string>) => {
  return useMemo(() => {
    const newParams = {};
    if (params.defaultAccount) {
      newParams.fromAccountId = params.defaultAccount.id;
    }
    if (params.defaultAmount) {
      newParams.amountFrom = params.defaultAmount;
    }
    return newParams;
  }, [params]);
};
