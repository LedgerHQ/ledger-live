import type { AccountLike } from "@ledgerhq/types-live";
import type { TransactionStatus } from "../../../../coin-modules/transaction-types";
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
 *
 * For sub-accounts (e.g. EVM ERC-20 tokens, TRC-20, SPL tokens), fees are paid
 * in the parent account's native currency. Subtracting them from a token
 * balance expressed in a different unit would be incorrect (and typically
 * collapses the result to 0, since a few gwei of fees outweigh a token balance
 * denominated in its smallest unit). In that case, the full token balance is
 * returned and fee sufficiency is validated by the bridge status instead.
 */
export function getMaxAvailable(
  account: AccountLike | null | undefined,
  estimatedFees: BigNumber,
): BigNumber {
  if (!account) return new BigNumber(0);
  const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
  const balance =
    spendable ?? ("balance" in account ? account.balance : undefined) ?? new BigNumber(0);
  if (account.type === "TokenAccount") {
    return BigNumber.max(0, balance);
  }
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
