import BigNumber from "bignumber.js";

/**
 *
 * @param value - The value to parse into a BigNumber. It can be a string, number, or an existing BigNumber instance.
 * @template T - The type of the value, which can be string, number, or BigNumber.
 * @returns  A BigNumber instance representing the parsed value.
 */
export const parseToBigNumber = <T extends string | number | BigNumber>(value: T): BigNumber => {
  if (value instanceof BigNumber) {
    return value;
  }
  if (typeof value === "string") {
    return new BigNumber(value.replace(/,/g, ""));
  }
  return new BigNumber(value);
};
