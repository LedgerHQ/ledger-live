import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type {
  Account,
  AccountBalance,
  AccountBalanceRaw,
  AccountLike,
  MaxSpendableFilters,
  TokenAccount,
} from "@ledgerhq/types-live";
import { UnsupportedMaxSpendableFilter } from "../errors";

export type { AccountBalance } from "@ledgerhq/types-live";

/** Rows produced by a family for a synced account; token rows are keyed by token account id. */
export type AccountBalancesResult = {
  account?: AccountBalance[];
  tokens?: Record<string, AccountBalance[]>;
};

export const clampLocked = (value: BigNumber, locked: BigNumber): BigNumber =>
  BigNumber.min(BigNumber.max(locked, 0), value);

/** A single row holding the whole balance, `locked` being the part that is not spendable. */
export function defaultAccountBalances(account: AccountLike): AccountBalance[] {
  const locked = clampLocked(account.balance, account.balance.minus(account.spendableBalance));
  return [locked.isZero() ? { value: account.balance } : { value: account.balance, locked }];
}

/**
 * Rows are valid when they partition `balance`: non-empty, `Σ value === balance`,
 * `0 ≤ locked ≤ value` on every row and one row per `(pool, private)` pair.
 */
export function isValidAccountBalances(balance: BigNumber, rows: AccountBalance[]): boolean {
  if (rows.length === 0) return false;
  const seen = new Set<string>();
  let sum = new BigNumber(0);
  for (const row of rows) {
    if (row.value.isNaN() || row.value.isNegative()) return false;
    if (row.locked && (row.locked.isNaN() || row.locked.isNegative() || row.locked.gt(row.value))) {
      return false;
    }
    const key = `${row.pool ?? ""}|${row.private ? 1 : 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    sum = sum.plus(row.value);
  }
  return sum.eq(balance);
}

const hasBalances = (account: AccountLike): boolean =>
  BigNumber.isBigNumber(account.balance) && BigNumber.isBigNumber(account.spendableBalance);

function pickRows(
  account: AccountLike,
  produced: AccountBalance[] | undefined,
  accountId: string,
): AccountBalance[] {
  if (produced) {
    if (isValidAccountBalances(account.balance, produced)) return produced;
    log("bridge", "invalid balances, default row used", { accountId });
  }
  return defaultAccountBalances(account);
}

/**
 * Returns a copy of the account whose `balances`, and the ones of its token accounts, are the
 * produced rows when they are valid and the default row otherwise. Nothing is inherited from a
 * previous sync.
 */
export function withAccountBalances<A extends Account>(
  account: A,
  produced?: AccountBalancesResult,
): A {
  // A partial account (no balance yet) has nothing to break down.
  if (!hasBalances(account)) return account;
  const res: A = { ...account, balances: pickRows(account, produced?.account, account.id) };
  if (account.subAccounts) {
    res.subAccounts = account.subAccounts.map((sub): TokenAccount =>
      // A partial sub-account (no balance yet) has nothing to break down.
      BigNumber.isBigNumber(sub.balance)
        ? { ...sub, balances: pickRows(sub, produced?.tokens?.[sub.id], sub.id) }
        : sub,
    );
  }
  return res;
}

export const toAccountBalancesRaw = (rows: AccountBalance[]): AccountBalanceRaw[] =>
  rows.map(({ value, locked, pool, private: isPrivate }) => ({
    value: value.toFixed(),
    ...(locked && { locked: locked.toFixed() }),
    ...(pool !== undefined && { pool }),
    ...(isPrivate !== undefined && { private: isPrivate }),
  }));

export const fromAccountBalancesRaw = (rows: AccountBalanceRaw[]): AccountBalance[] =>
  rows.map(({ value, locked, pool, private: isPrivate }) => ({
    value: new BigNumber(value),
    ...(locked !== undefined && { locked: new BigNumber(locked) }),
    ...(pool !== undefined && { pool }),
    ...(isPrivate !== undefined && { private: isPrivate }),
  }));

/** Restores persisted rows, or the default row for an account persisted without them. */
export const restoreAccountBalances = (
  rows: AccountBalanceRaw[] | undefined,
  account: AccountLike,
): AccountBalance[] => (rows ? fromAccountBalancesRaw(rows) : defaultAccountBalances(account));

/**
 * The rows of `account.balances` that `filters` select. A transaction spends from one pool, so
 * `pools` names exactly one; a row matches on its `pool` and on its `private` flag, the rows of a
 * family that has no pools being public and carrying no pool.
 *
 * Throws `UnsupportedMaxSpendableFilter` when the filters cannot be honoured, so the caller is told
 * instead of being given the unfiltered figure.
 */
export function selectMaxSpendableRows(
  account: AccountLike,
  filters: MaxSpendableFilters,
): AccountBalance[] {
  const { pools, private: isPrivate } = filters;

  if (pools !== undefined && pools.length !== 1) {
    throw new UnsupportedMaxSpendableFilter(
      `"pools" must name exactly one pool, got ${pools.length}`,
    );
  }

  const rows = (account.balances ?? []).filter(
    row =>
      (pools === undefined || row.pool === pools[0]) &&
      (isPrivate === undefined || !!row.private === isPrivate),
  );

  if (rows.length === 0) {
    throw new UnsupportedMaxSpendableFilter(
      `No balance of this account matches ${JSON.stringify(filters)}`,
    );
  }

  return rows;
}

/** The spendable part of `rows`: their value minus what is locked. */
export const spendableOfRows = (rows: AccountBalance[]): BigNumber =>
  rows.reduce((sum, row) => sum.plus(row.value).minus(row.locked ?? 0), new BigNumber(0));
