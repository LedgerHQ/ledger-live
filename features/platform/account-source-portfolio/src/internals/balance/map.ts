import type { BalanceEntry } from "@domain/api-account-portfolio";
import {
  AccountAssetBalanceSchema,
  type AccountAssetBalance,
} from "@domain/entity-account-balance";
import { currencyIdFromNetwork, type AccountDescriptor } from "@domain/entity-account-descriptor";

/** `unmapped`: tokens with no CAL id, left out. `unreadable`: assets whose amount could not be read. */
export type MappedBalances = { rows: AccountAssetBalance[]; unmapped: number; unreadable: number };

/** Our asset id: the account's coin for `native`, the CAL id for a token; undefined without one. */
const assetIdOf = (descriptor: AccountDescriptor, entry: BalanceEntry) =>
  entry.asset === "native" ? descriptor.network : (entry.cal_id ?? undefined);

const sum = (parts: readonly BalanceEntry[]) =>
  parts.reduce((total, part) => total + BigInt(part.amount), 0n).toString();

type Statuses = { confirmed: BalanceEntry[]; pending: BalanceEntry[] };

/** Per locked and unlocked part, its confirmed entries when there are some, else its pending ones. */
const keptOf = (parts: ReadonlyMap<boolean, Statuses>) =>
  [...parts.values()].flatMap(({ confirmed, pending }) =>
    confirmed.length > 0 ? confirmed : pending,
  );

/** One row per asset, native coin first; the locked parts are not spendable. */
export function toAccountBalances(
  descriptor: AccountDescriptor,
  entries: readonly BalanceEntry[],
): MappedBalances {
  const assets = new Map<string, Map<boolean, Statuses>>();
  let unmapped = 0;
  for (const entry of entries) {
    const assetId = assetIdOf(descriptor, entry);
    if (assetId === undefined) {
      unmapped += 1;
      continue;
    }
    const parts = assets.get(assetId) ?? new Map<boolean, Statuses>();
    const part = parts.get(entry.locked) ?? { confirmed: [], pending: [] };
    part[entry.status].push(entry);
    parts.set(entry.locked, part);
    assets.set(assetId, parts);
  }
  let unreadable = 0;
  const rows = [...assets].flatMap(([assetId, parts]) => {
    const kept = keptOf(parts);
    const parsed = kept.every(part => /^\d+$/.test(part.amount))
      ? AccountAssetBalanceSchema.safeParse({
          assetId,
          balance: sum(kept),
          spendableBalance: sum(kept.filter(part => !part.locked)),
        })
      : undefined;
    if (parsed?.success) return [parsed.data];
    unreadable += 1;
    return [];
  });
  const isNative = (row: AccountAssetBalance) =>
    row.assetId === currencyIdFromNetwork(descriptor.network);
  rows.sort((a, b) => Number(isNative(b)) - Number(isNative(a)));
  return { rows, unmapped, unreadable };
}
