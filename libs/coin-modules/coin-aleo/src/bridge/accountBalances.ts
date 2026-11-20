import BigNumber from "bignumber.js";
import {
  type AccountBalance,
  type AccountBalancesResult,
  clampLocked,
} from "@ledgerhq/ledger-wallet-framework/account/balances";
import type { AleoAccount, AleoOperationExtra, AleoTokenAccount } from "../types";

type Operation = AleoAccount["pendingOperations"][number];
type Visibility = "public" | "private";

const ZERO = new BigNumber(0);

function visibilityOf(op: Operation): Visibility {
  const extra = op.extra as Partial<AleoOperationExtra> | null | undefined;
  return extra?.transactionType === "private" ? "private" : "public";
}

/**
 * What a pending operation already commits on the row it spends from: the amount of an outgoing
 * transfer or a bond, plus its fee for the native asset. Incoming operations commit nothing.
 */
function pendingSpend(op: Operation, includeFee: boolean): BigNumber {
  const fee = includeFee ? op.fee : ZERO;
  if (op.type === "OUT") return op.value.plus(fee);
  // A pending bond carries the fee as its value; the bonded amount is in `extra.stakedAmount`.
  if (op.type === "BOND") {
    const extra = op.extra as Partial<AleoOperationExtra> | null | undefined;
    return (extra?.stakedAmount ?? ZERO).plus(fee);
  }
  return fee;
}

function pendingSpentBy(
  operations: Operation[],
  visibility: Visibility,
  includeFee: boolean,
): BigNumber {
  return operations
    .filter(op => visibilityOf(op) === visibility)
    .reduce((sum, op) => sum.plus(pendingSpend(op, includeFee)), ZERO);
}

function row(value: BigNumber, locked: BigNumber, isPrivate: boolean): AccountBalance {
  return {
    value,
    locked: clampLocked(value, locked),
    ...(isPrivate && { private: true }),
  };
}

function tokenRows(subAccount: AleoTokenAccount): AccountBalance[] {
  const pending = subAccount.pendingOperations ?? [];
  return [
    row(subAccount.transparentBalance, pendingSpentBy(pending, "public", false), false),
    row(subAccount.privateBalance ?? ZERO, pendingSpentBy(pending, "private", false), true),
  ];
}

/**
 * The balance as a public row, holding the bonded and unbonding funds as locked, and a private row.
 * Funds committed to pending operations are locked on the row they spend from; an operation
 * without a transaction type counts on the public row.
 */
export function aleoAccountBalances(account: AleoAccount): AccountBalancesResult {
  const resources = account.aleoResources;
  const tokens: Record<string, AccountBalance[]> = {};
  for (const subAccount of account.subAccounts ?? []) {
    if (subAccount.type === "TokenAccount") {
      tokens[subAccount.id] = tokenRows(subAccount as AleoTokenAccount);
    }
  }
  if (!resources) return { tokens };

  const staked = (resources.bondedBalance ?? ZERO).plus(resources.unbondingBalance ?? ZERO);
  const pending = account.pendingOperations ?? [];

  return {
    account: [
      row(
        resources.transparentBalance.plus(staked),
        staked.plus(pendingSpentBy(pending, "public", true)),
        false,
      ),
      row(resources.privateBalance ?? ZERO, pendingSpentBy(pending, "private", true), true),
    ],
    tokens,
  };
}
