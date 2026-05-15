import type { Account, AccountLike } from "@ledgerhq/types-live";

/**
 * Main (chain) accounts indexed by id. Used to resolve the parent of a
 * `TokenAccount` exposed by `buildAssetDistribution` so the consumer can render
 * the parent's fresh address, name, etc.
 */
export function buildMainAccountByIdMap(accounts: readonly AccountLike[]): Map<string, Account> {
  const map = new Map<string, Account>();
  for (const a of accounts) {
    if (a.type === "Account") {
      map.set(a.id, a);
    }
  }
  return map;
}

export function lookupParentAccountFromMap(
  mainAccountById: ReadonlyMap<string, Account>,
  id: string,
): Account | null {
  return mainAccountById.get(id) ?? null;
}
