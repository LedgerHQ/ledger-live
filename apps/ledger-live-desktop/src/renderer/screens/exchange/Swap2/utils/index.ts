import { useCallback, useMemo } from "react";
import { useHistory } from "react-router-dom";
import * as providerIcons from "~/renderer/icons/providers";
import { SwapExchangeRateAmountTooLow } from "@ledgerhq/live-common/errors";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { track } from "~/renderer/analytics/segment";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
export const SWAP_VERSION = "2.35";
export const useGetSwapTrackingProperties = () => {
  const swapShowDexQuotes = useFeature("swapShowDexQuotes");
  return useMemo(
    () => ({
      swapVersion: SWAP_VERSION,
      flow: "swap",
      isDexEnabled: swapShowDexQuotes?.enabled ?? false,
    }),
    [swapShowDexQuotes?.enabled],
  );
};
export const useRedirectToSwapHistory = () => {
  const history = useHistory();
  return useCallback(
    ({
      swapId,
    }: {
      swapId?: string;
    } = {}) => {
      history.push({
        pathname: "/swap/history",
        state: {
          swapId,
        },
      });
    },
    [history],
  );
};
export const iconByProviderName = Object.entries(providerIcons).reduce(
  (obj, [key, value]) => ({
    ...obj,
    [key.toLowerCase()]: value,
  }),
  {},
);
export const getProviderIcon = (exchangeRate: ExchangeRate) =>
  iconByProviderName[exchangeRate.provider.toLowerCase()];
export const trackSwapError = (error: any, properties: any = {}) => {
  if (!error) return;
  if (error instanceof SwapExchangeRateAmountTooLow) {
    track("error_message", {
      ...properties,
      message: "min_amount",
    });
  }
  if (error instanceof NotEnoughBalance) {
    track("error_message", {
      ...properties,
      message: "no_funds",
    });
  }
};
