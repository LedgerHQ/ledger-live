import BigNumber from "bignumber.js";

export function fromBigNumberToBigInt<T>(
  bigNumber: BigNumber | undefined,
  defaultValue?: T,
): bigint | T {
  if (bigNumber != null) {
    return BigInt(bigNumber.toFixed());
  }
  return defaultValue as T;
}
