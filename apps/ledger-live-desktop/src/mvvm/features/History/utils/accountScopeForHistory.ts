import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import type { Account } from "@ledgerhq/types-live";

/** URL query `accountIds`: comma-separated Ledger Live account ids. */
export function parseAccountIdsSearchParam(searchParam: string | null): string[] | null {
  if (!searchParam) return null;
  const ids = searchParam
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  return ids.length ? ids : null;
}

/**
 * Keeps top-level portfolio accounts whose flattened sub-accounts intersect {@link allowedAccountIds}.
 */
export function filterTopLevelAccountsByAllowedAccountIds(
  topLevelAccounts: Account[],
  allowedAccountIds: Set<string>,
): Account[] {
  return topLevelAccounts.filter(top =>
    flattenAccounts([top]).some(acc => allowedAccountIds.has(acc.id)),
  );
}

export function filterOperationTableItemsByAllowedAccountIds<T extends { account: { id: string } }>(
  items: readonly T[],
  allowedAccountIds: ReadonlySet<string>,
): T[] {
  return items.filter(item => allowedAccountIds.has(item.account.id));
}
