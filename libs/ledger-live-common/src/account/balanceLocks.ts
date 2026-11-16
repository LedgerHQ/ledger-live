import BigNumber from "bignumber.js";
import {
  BalanceLockSchema,
  type BalanceLock,
  type BalanceLockReason,
} from "@domain/entity-account-balance";

/** The locks with an amount above zero, in the order given, amounts in the smallest unit. */
export function toBalanceLocks(
  parts: ReadonlyArray<readonly [BalanceLockReason, BigNumber]>,
): BalanceLock[] {
  return parts
    .filter(([, amount]) => amount.gt(0))
    .map(([reason, amount]) =>
      BalanceLockSchema.parse({
        reason,
        amount: amount.integerValue(BigNumber.ROUND_FLOOR).toFixed(0),
      }),
    );
}

export const sumOf = (amounts: ReadonlyArray<BigNumber | null | undefined>): BigNumber =>
  amounts.reduce<BigNumber>((sum, amount) => (amount ? sum.plus(amount) : sum), new BigNumber(0));
