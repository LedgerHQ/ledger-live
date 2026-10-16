import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";

/**
 * A numeric fee parameter as the module reads it: a bigint, a safe integer or an integer string.
 *
 * Ledger Live's generic bridge keeps the last estimate's `parameters` JSON-safe, with bigints as
 * decimal strings (`feeParametersToJsonSafe`), and passes them back that way in `customFees`
 * (`getTransactionStatus`, `signOperation`). The send-max `amount` and `feePerByte` that
 * `estimateFees` returned may therefore come back as strings. A negative value is refused.
 */
export function toBigInt(value: unknown, field: string): bigint {
  const amount = readInteger(value);
  if (amount === undefined || amount < 0n) {
    throw new Error(`${field} must be a non-negative integer amount`);
  }
  return amount;
}

/** `value` as a bigint when it is one, a safe integer or an integer string; otherwise `undefined`. */
function readInteger(value: unknown): bigint | undefined {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return BigInt(value);
  if (typeof value === "string" && /^\d+$/.test(value)) return BigInt(value);
  return undefined;
}

/** The numeric fee parameter `field`, or `undefined` when absent. */
export function amountParameter(
  parameters: FeeEstimation["parameters"],
  field: string,
): bigint | undefined {
  const value = parameters?.[field];
  return value === undefined || value === null ? undefined : toBigInt(value, field);
}
