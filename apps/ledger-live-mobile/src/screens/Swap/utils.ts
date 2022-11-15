import { SwapExchangeRateAmountTooLow } from "@ledgerhq/live-common/errors";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { track } from "../../analytics/segment";

export const SWAP_VERSION = "2.34";

export const trackSwapError = (error: Error, properties = {}) => {
  if (!error) return;
  if (error instanceof SwapExchangeRateAmountTooLow) {
    track("Page Swap Form - Error Less Mini", {
      ...properties,
    });
  }
  if (error instanceof NotEnoughBalance) {
    track("Page Swap Form - Error No Funds", {
      ...properties,
    });
  }
};
