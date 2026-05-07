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

/**
 * Expands History `accountIds` into concrete Ledger Live account ids used to filter each row's
 * `OperationTableItem.account.id`.
 *
 * - A portfolio **root** id expands to every account returned by {@link flattenAccounts} for that
 *   subtree (native + tokens + children).
 * - Any other recognised id keeps **only itself** (e.g. a token account under Ethereum).
 *
 * IDs that belong to none of {@link topLevelAccounts} are omitted.
 */
export function expandRequestedAccountIdsForHistoryScope(
  topLevelAccounts: Account[],
  requestedIds: ReadonlySet<string>,
): Set<string> {
  if (requestedIds.size === 0) return new Set<string>();
  const expanded = new Set<string>();

  for (const top of topLevelAccounts) {
    const flat = flattenAccounts([top]);
    if (requestedIds.has(top.id)) {
      flat.forEach(account => expanded.add(account.id));
      continue;
    }

    for (const account of flat) {
      if (requestedIds.has(account.id)) expanded.add(account.id);
    }
  }

  return expanded;
}

export function filterOperationTableItemsByAllowedAccountIds<T extends { account: { id: string } }>(
  items: readonly T[],
  allowedAccountIds: ReadonlySet<string>,
): T[] {
  return items.filter(item => allowedAccountIds.has(item.account.id));
}
