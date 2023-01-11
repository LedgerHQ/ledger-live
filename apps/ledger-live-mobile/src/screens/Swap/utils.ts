import { useCallback } from "react";
import { SwapExchangeRateAmountTooLow } from "@ledgerhq/live-common/errors";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { useAnalytics } from "../../analytics/segment";

export const SWAP_VERSION = "2.34";

export const sharedSwapTracking = {
  swapVersion: SWAP_VERSION,
  flow: "swap",
};

export const useTrackSwapError = () => {
  const { track } = useAnalytics();
  return useCallback(
    (error: Error, properties = {}) => {
      if (!error) return;
      if (error instanceof SwapExchangeRateAmountTooLow) {
        track("error_message", {
          ...sharedSwapTracking,
          ...properties,
          message: "min_amount",
        });
      }
      if (error instanceof NotEnoughBalance) {
        track("error_message", {
          ...sharedSwapTracking,
          ...properties,
          message: "no_funds",
        });
      }
    },
    [track],
  );
};
