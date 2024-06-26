import { useCallback } from "react";
import { useHistory } from "react-router-dom";
import { SwapExchangeRateAmountTooLow } from "@ledgerhq/live-common/errors";
import { NotEnoughBalanceSwap } from "@ledgerhq/errors";
import { track } from "~/renderer/analytics/segment";

export const SWAP_VERSION = "2.35";

const SWAP_TRACKING_PROPERTIES = {
  swapVersion: SWAP_VERSION,
  flow: "swap",
};

export const useGetSwapTrackingProperties = () => {
  return SWAP_TRACKING_PROPERTIES;
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

export const trackSwapError = (error: Error, properties: Record<string, unknown> = {}) => {
  if (!error) return;
  if (error instanceof SwapExchangeRateAmountTooLow) {
    track("error_message", {
      ...properties,
      message: "min_amount",
    });
  }
  if (error instanceof NotEnoughBalanceSwap) {
    track("error_message", {
      ...properties,
      message: "no_funds",
    });
  }
};
