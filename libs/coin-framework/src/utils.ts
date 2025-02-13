import BigNumber from "bignumber.js";

export function fromBigNumberToBigInt<T>(
  bigNumber: BigNumber | undefined,
  defaultValue?: T,
): bigint | T {
  if (bigNumber != null) {
    return BigInt(bigNumber.toString());
  }
  return defaultValue as T;
}
