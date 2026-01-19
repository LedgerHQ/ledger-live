import { useCallback } from "react";
import { useNavigate } from "react-router";
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
  const navigate = useNavigate();
  return useCallback(
    ({
      swapId,
    }: {
      swapId?: string;
    } = {}) => {
      navigate("/swap/history", {
        state: {
          swapId,
        },
      });
    },
    [navigate],
  );
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
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
