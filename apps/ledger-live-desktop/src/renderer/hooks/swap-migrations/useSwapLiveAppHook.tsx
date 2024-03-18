import { v4 } from "uuid";
import { useEffect, useRef } from "react";
import isEqual from "lodash/isEqual";
import { useSelector } from "react-redux";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import {
  SwapProps,
  SwapWebManifestIDs,
  SwapWebProps,
} from "~/renderer/screens/exchange/Swap2/Form/SwapWebView";
import { rateSelector } from "~/renderer/actions/swap";
import { getEnv } from "@ledgerhq/live-env";

export type UseSwapLiveAppHookProps = {
  manifestID: string | null;
  isSwapLiveAppEnabled: boolean;
  swapTransaction: SwapTransactionType;
  swapError?: Error;
  updateSwapWebProps: React.Dispatch<React.SetStateAction<Partial<SwapProps> | undefined>>;
  getExchangeSDKParams: () => Partial<SwapProps>;
  getProviderRedirectURLSearch: () => URLSearchParams;
};

const SWAP_API_BASE = getEnv("SWAP_API_BASE");

export const useSwapLiveAppHook = (props: UseSwapLiveAppHookProps) => {
  const {
    isSwapLiveAppEnabled,
    manifestID,
    swapTransaction,
    swapError,
    updateSwapWebProps,
    getExchangeSDKParams,
    getProviderRedirectURLSearch,
  } = props;
  const exchangeRate = useSelector(rateSelector);
  const provider = exchangeRate?.provider;
  const exchangeRatesState = swapTransaction.swap?.rates;
  const swapWebPropsRef = useRef<SwapWebProps["swapState"] | undefined>(undefined);

  useEffect(() => {
    if (isSwapLiveAppEnabled) {
      const providerRedirectURLSearch = getProviderRedirectURLSearch();
      const { parentAccount: fromParentAccount } = swapTransaction.swap.from;
      const fromParentAccountId = fromParentAccount
        ? accountToWalletAPIAccount(fromParentAccount)?.id
        : undefined;
      const providerRedirectURL = `ledgerlive://discover/${getProviderName(
        provider ?? "",
      ).toLowerCase()}?${providerRedirectURLSearch.toString()}`;

      let loading = swapTransaction.bridgePending;

      if (manifestID === SwapWebManifestIDs.Demo0) {
        loading = swapTransaction.bridgePending || exchangeRatesState.status === "loading";
      }

      const newSwapWebProps = {
        provider,
        ...getExchangeSDKParams(),
        fromParentAccountId,
        error: !!swapError,
        loading,
        providerRedirectURL,
        swapApiBase: `${SWAP_API_BASE}/swap`,
      };

      if (!isEqual(newSwapWebProps, swapWebPropsRef.current)) {
        swapWebPropsRef.current = newSwapWebProps;
        updateSwapWebProps({ ...newSwapWebProps, cacheKey: v4() });
      }
    }
  }, [
    provider,
    manifestID,
    isSwapLiveAppEnabled,
    getExchangeSDKParams,
    getProviderRedirectURLSearch,
    swapTransaction.swap.from,
    swapError,
    swapTransaction.bridgePending,
    exchangeRatesState.status,
    updateSwapWebProps,
  ]);
};
