import BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "../../../account";
import { delay } from "../../../promise";

export const WITHDRAW_BALANCE_REFLECTION_TIMEOUT_MS = 60_000;
export const WITHDRAW_BALANCE_REFLECTION_POLL_MS = 2_000;
/**
 * The signing screen skips syncs under priority 100 while a device is selected (LLM
 * `SyncSkipUnderPriority`), and the wait runs on that screen: a lower priority would be dropped.
 */
export const WITHDRAW_BALANCE_REFLECTION_SYNC_PRIORITY = 100;

export type WithdrawBalanceReflectionOutcome = "reflected" | "timeout" | "cancelled";

export type WithdrawBalanceReflectionParams = Readonly<{
  /** The HyperCore available balance, at or below which the withdraw shows. */
  targetBalance: BigNumber;
  /** The HyperCore available balance from the latest sync. */
  getBalance: () => BigNumber;
  /** Requests a sync of the HyperCore account. */
  syncAccount: () => void;
  /** The user left: the background sync updates the balance later. */
  isCancelled?: () => boolean;
  timeoutMs?: number;
  pollMs?: number;
}>;

/**
 * The balance once the withdraw shows: lower by at least the amount withdrawn (the Hyperliquid fee
 * comes on top). A smaller drop, e.g. from trading in perps-live-app, does not count.
 */
export function getWithdrawTargetBalance(
  sourceAccount: AccountLike,
  balanceBefore: BigNumber,
  amountFrom: BigNumber.Value,
): BigNumber {
  const amount = new BigNumber(amountFrom)
    .shiftedBy(getAccountCurrency(sourceAccount).units[0].magnitude)
    .integerValue(BigNumber.ROUND_DOWN);
  return balanceBefore.minus(amount);
}

/**
 * The swap backend sends the withdraw to Hyperliquid on its own, ~15s after the submit, and the
 * balances API follows a few seconds later. Syncs the HyperCore account until its balance drops
 * to the target balance, as perps-live-app does for deposits. Never throws: on
 * timeout the withdraw still went through, only the balance is late.
 */
export async function waitForWithdrawBalanceReflected({
  targetBalance,
  getBalance,
  syncAccount,
  isCancelled = () => false,
  timeoutMs = WITHDRAW_BALANCE_REFLECTION_TIMEOUT_MS,
  pollMs = WITHDRAW_BALANCE_REFLECTION_POLL_MS,
}: WithdrawBalanceReflectionParams): Promise<WithdrawBalanceReflectionOutcome> {
  const deadline = Date.now() + timeoutMs;
  const isReflected = () => getBalance().isLessThanOrEqualTo(targetBalance);

  while (Date.now() < deadline) {
    if (isCancelled()) return "cancelled";
    if (isReflected()) return "reflected";
    syncAccount();
    await delay(Math.min(pollMs, deadline - Date.now()));
  }

  return isReflected() ? "reflected" : "timeout";
}
