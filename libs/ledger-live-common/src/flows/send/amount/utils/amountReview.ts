import type { AccountLike } from "@ledgerhq/types-live";
import type { TransactionStatus } from "../../../../generated/types";
import { BigNumber } from "bignumber.js";

/**
 * Known "insufficient funds" amount error names used by bridges.
 * Covers all NotEnough* variants and Insufficient* errors.
 */
const INSUFFICIENT_FUNDS_AMOUNT_ERROR_NAMES = [
  "NotEnoughBalance",
  "NotEnoughBalanceFees",
  "NotEnoughBalanceSwap",
  "NotEnoughBalanceBecauseDestinationNotCreated",
  "NotEnoughBalanceInParentAccount",
  "NotEnoughBalanceToDelegate",
] as const;

/**
 * Maximum amount the user can send (spendable/balance minus estimated fees).
 * Returns zero if account is missing or balance would be negative.
 */
export function getMaxAvailable(
  account: AccountLike | null | undefined,
  estimatedFees: BigNumber,
): BigNumber {
  if (!account) return new BigNumber(0);
  const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
  const balance =
    spendable ?? ("balance" in account ? account.balance : undefined) ?? new BigNumber(0);
  const safeMax = balance.minus(estimatedFees);
  return BigNumber.max(0, safeMax);
}

/**
 * Returns true if the transaction status has an amount error that indicates
 * insufficient funds (so the CTA can show "Get funds" instead of "Review").
 */
export function isInsufficientFundsAmountError(status: TransactionStatus): boolean {
  const amountError = status.errors?.amount;
  if (!amountError) return false;
  const errorName = amountError.name;
  if (typeof errorName !== "string") return false;
  if (
    INSUFFICIENT_FUNDS_AMOUNT_ERROR_NAMES.includes(
      errorName as (typeof INSUFFICIENT_FUNDS_AMOUNT_ERROR_NAMES)[number],
    )
  )
    return true;
  if (errorName.includes("Insufficient")) return true;
  return false;
}
