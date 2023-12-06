import { v4 } from "uuid";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { accountToWalletAPIAccount } from "@ledgerhq/live-common/wallet-api/converters";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { SwapProps, SwapWebManifestIDs } from "~/renderer/screens/exchange/Swap2/Form/SwapWebView";
import { rateSelector } from "~/renderer/actions/swap";

export type UseSwapLiveAppDemo0Props = {
  manifestID: string;
  isSwapLiveAppEnabled: boolean;
  swapTransaction: SwapTransactionType;
  swapError?: Error;
  updateSwapWebProps: React.Dispatch<React.SetStateAction<Partial<SwapProps> | undefined>>;
  getExchangeSDKParams: () => Partial<SwapProps>;
  getProviderRedirectURLSearch: () => URLSearchParams;
};

export const useSwapLiveAppDemo0 = (props: UseSwapLiveAppDemo0Props) => {
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

  useEffect(() => {
    if (isSwapLiveAppEnabled && manifestID === SwapWebManifestIDs.Demo0) {
      const providerRedirectURLSearch = getProviderRedirectURLSearch();
      const { parentAccount: fromParentAccount } = swapTransaction.swap.from;
      const fromParentAccountId = fromParentAccount
        ? accountToWalletAPIAccount(fromParentAccount)?.id
        : undefined;
      const providerRedirectURL = `ledgerlive://discover/${getProviderName(
        provider ?? "",
      ).toLowerCase()}?${providerRedirectURLSearch.toString()}`;
      updateSwapWebProps({
        provider,
        ...getExchangeSDKParams(),
        fromParentAccountId,
        cacheKey: v4(),
        error: !!swapError,
        loading: swapTransaction.bridgePending || exchangeRatesState.status === "loading",
        providerRedirectURL,
      });
    }
  }, [
    provider,
    isSwapLiveAppEnabled,
    getExchangeSDKParams,
    getProviderRedirectURLSearch,
    swapTransaction.swap.from,
    swapError,
    swapTransaction.bridgePending,
    exchangeRatesState.status,
  ]);
};
