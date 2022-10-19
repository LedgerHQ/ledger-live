// @flow
import { useCallback } from "react";
import { useHistory } from "react-router-dom";
import * as providerIcons from "~/renderer/icons/providers";
import type { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { SwapExchangeRateAmountTooLow } from "@ledgerhq/live-common/errors";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { track } from "~/renderer/analytics/segment";

export const SWAP_VERSION = "2.35";

export const swapDefaultTrack = {
  swapVersion: SWAP_VERSION,
  flow: "swap",
};

export const useRedirectToSwapHistory = () => {
  const history = useHistory();

  return useCallback(
    ({ swapId }: { swapId?: string } = {}) => {
      history.push({ pathname: "/swap/history", state: { swapId } });
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

export const trackSwapError = (error: *, properties: * = {}) => {
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
