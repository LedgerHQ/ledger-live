import { BigNumber } from "bignumber.js";

/** Format value as hex with 0x prefix for JSON-RPC (Go hexutil.Big requires 0x). Clamps negative to 0. */
export const valueToHex = (value: BigNumber): string => {
  if (value.isNegative() || value.isZero()) return "0x0";
  return "0x" + value.toString(16);
};
