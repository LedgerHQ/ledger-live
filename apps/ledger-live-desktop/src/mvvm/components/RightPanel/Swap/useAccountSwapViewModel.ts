import { useMemo } from "react";
import { buildSwapNavigationState } from "LLD/features/Market/utils/swapNavigation";
import { useAccountFromRouteParams } from "LLD/features/AccountDetail/hooks/useRouteAccount";
import { matchAccountRoute } from "LLD/features/AccountDetail/utils/matchAccountRoute";
import type { SwapViewModel } from "./types";
import { buildSwapWebViewKey } from "./useSwapViewModel";

export const useAccountSwapViewModel = (pathname: string): SwapViewModel => {
  const { mainAccount } = useAccountFromRouteParams(matchAccountRoute(pathname));

  return useMemo(() => {
    if (!mainAccount) return { initialSwapState: undefined, webviewKey: buildSwapWebViewKey() };
    return {
      initialSwapState: buildSwapNavigationState({
        defaultCurrency: mainAccount.currency,
        fromPath: pathname,
        account: mainAccount,
      }),
      webviewKey: buildSwapWebViewKey(mainAccount.currency.id, mainAccount.id),
    };
  }, [mainAccount, pathname]);
};
