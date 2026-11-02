import type { Account } from "@ledgerhq/types-live";

const UNKNOWN_ACCOUNT_INDEX = Number.MAX_SAFE_INTEGER;

export function orderAccountsByIds(
  accounts: readonly Account[],
  accountIds: readonly string[],
): Account[] {
  const indexById = new Map(accountIds.map((id, index) => [id, index]));
  return [...accounts].sort(
    (left, right) =>
      (indexById.get(left.id) ?? UNKNOWN_ACCOUNT_INDEX) -
      (indexById.get(right.id) ?? UNKNOWN_ACCOUNT_INDEX),
  );
}
