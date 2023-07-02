import { useCallback, useMemo } from "react";
import { useHistory } from "react-router-dom";
import * as providerIcons from "~/renderer/icons/providers";
import { SwapExchangeRateAmountTooLow } from "@ledgerhq/live-common/errors";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { track } from "~/renderer/analytics/segment";
import { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
export const SWAP_VERSION = "2.35";
export const useGetSwapTrackingProperties = () => {
  return useMemo(
    () => ({
      swapVersion: SWAP_VERSION,
      flow: "swap",
    }),
    [],
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
export const iconByProviderName: Record<
  string,
  React.ComponentType<{ size?: number }>
> = Object.entries(providerIcons).reduce(
  (obj, [key, value]) => ({
    ...obj,
    [key.toLowerCase()]: value,
  }),
  {},
);
export const getProviderIcon = (exchangeRate: ExchangeRate) =>
  iconByProviderName[exchangeRate.provider.toLowerCase() as keyof typeof iconByProviderName];
export const trackSwapError = (error: Error, properties: Record<string, unknown> = {}) => {
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
