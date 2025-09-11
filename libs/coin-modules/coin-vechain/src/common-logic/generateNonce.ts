import { Hex } from "@vechain/sdk-core";

/**
 * Generate a Unique ID to be used as a nonce
 * @returns a unique string
 */
export const generateNonce = (): string => {
  return Hex.random(8).toString();
};
