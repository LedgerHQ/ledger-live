import BigNumber from "bignumber.js";
import type { CantonCoinConfig } from "../config";

export const UINT32_MAX = new BigNumber(2).pow(32).minus(1);

export const validateTag = (tag: BigNumber) => {
  return (
    !tag.isNaN() && tag.isFinite() && tag.isInteger() && tag.isPositive() && tag.lte(UINT32_MAX)
  );
};

const CANTON_ADDRESS_REGEX = /^[a-zA-Z0-9\-_]{1,128}::[a-f0-9]{68}$/;

export function isRecipientValid(recipient: string): boolean {
  return CANTON_ADDRESS_REGEX.test(recipient);
}

// Through BigNumber, as the bridge reads it: `BigInt(1e38)` is not 10^38.
export const minReserveOf = (config: CantonCoinConfig): bigint =>
  BigInt(new BigNumber(config.minReserve ?? 0).toFixed(0));
