import { useCallback } from "react";
import { useHistory } from "react-router-dom";
import { SwapExchangeRateAmountTooLow } from "@ledgerhq/live-common/errors";
import { NotEnoughBalanceSwap } from "@ledgerhq/errors";
import { track } from "~/renderer/analytics/segment";
import BigNumber from "bignumber.js";

export const SWAP_VERSION = "2.35";

const SWAP_TRACKING_PROPERTIES = {
  swapVersion: SWAP_VERSION,
  flow: "swap",
  live_app: "swap",
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

type TransformableObject = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

/**
 * Recursively transforms all number strings in an object into BigNumber instances.
 * @param {TransformableObject} obj - The object to transform.
 * @returns {TransformableObject} - The transformed object with BigNumber instances.
 */
export function transformToBigNumbers(obj: TransformableObject): TransformableObject {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const transformedObj: TransformableObject = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === "string" && !isNaN(value as unknown as number)) {
        transformedObj[key] = new BigNumber(value);
      } else if (typeof value === "object") {
        transformedObj[key] = transformToBigNumbers(value);
      } else {
        transformedObj[key] = value;
      }
    }
  }

  return transformedObj;
}
