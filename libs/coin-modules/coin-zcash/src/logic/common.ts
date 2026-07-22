import { BigNumber } from "bignumber.js";

/** Parses a decimal string (e.g. zatoshi amount) into a BigNumber. */
export function parseAPIValue(value: string): BigNumber {
  return new BigNumber(value);
}
