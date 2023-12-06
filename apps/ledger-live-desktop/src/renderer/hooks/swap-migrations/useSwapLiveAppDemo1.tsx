import { v4 } from "uuid";
import { useEffect } from "react";

import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import { SwapWebManifestIDs } from "~/renderer/screens/exchange/Swap2/Form/SwapWebView";
import { UseSwapLiveAppDemo0Props } from "./useSwapLiveAppDemo0";

export type UseSwapLiveAppDemo1Props = UseSwapLiveAppDemo0Props;

export const useSwapLiveAppDemo1 = (props: UseSwapLiveAppDemo1Props) => {
  const {
    isSwapLiveAppEnabled,
    manifestID,
    swapTransaction,
    swapError,
    updateSwapWebProps,
    getExchangeSDKParams,
  } = props;

  useEffect(() => {
    if (isSwapLiveAppEnabled && manifestID === SwapWebManifestIDs.Demo1) {
      const { parentAccount: fromParentAccount } = swapTransaction.swap.from;
      const fromParentAccountId = fromParentAccount
        ? accountToWalletAPIAccount(fromParentAccount)?.id
        : undefined;

      // Currency ids
      const fromCurrencyId = swapTransaction.swap.from.currency?.id;
      const toCurrencyId = swapTransaction.swap.to.currency?.id;

      updateSwapWebProps({
        ...getExchangeSDKParams(),
        fromParentAccountId,
        cacheKey: v4(),
        error: !!swapError,
        loading: swapTransaction.bridgePending,
        fromCurrencyId,
        toCurrencyId,
      });
    }
  }, [
    isSwapLiveAppEnabled,
    getExchangeSDKParams,
    swapTransaction.swap.from,
    swapError,
    swapTransaction.bridgePending,
  ]);
};
