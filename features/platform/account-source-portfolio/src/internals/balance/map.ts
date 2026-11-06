import type { BalanceEntry } from "@domain/api-account-portfolio";
import {
  AccountAssetBalanceSchema,
  type AccountAssetBalance,
} from "@domain/entity-account-balance";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";

/** `unmapped`: tokens with no CAL id, left out. `unreadable`: assets whose amount could not be read. */
export type MappedBalances = { rows: AccountAssetBalance[]; unmapped: number; unreadable: number };

/** Our asset id: the account's coin for `native`, the CAL id for a token; undefined without one. */
const assetIdOf = (descriptor: AccountDescriptor, entry: BalanceEntry) =>
  entry.asset === "native" ? descriptor.network : (entry.cal_id ?? undefined);

const sum = (parts: readonly BalanceEntry[]) =>
  parts.reduce((total, part) => total + BigInt(part.amount), 0n).toString();

/** One row per asset, native coin first: the confirmed entries when there are some, the locked parts not spendable. */
export function toAccountBalances(
  descriptor: AccountDescriptor,
  entries: readonly BalanceEntry[],
): MappedBalances {
  const assets = new Map<string, { confirmed: BalanceEntry[]; pending: BalanceEntry[] }>();
  let unmapped = 0;
  for (const entry of entries) {
    const assetId = assetIdOf(descriptor, entry);
    if (assetId === undefined) {
      unmapped += 1;
      continue;
    }
    const asset = assets.get(assetId) ?? { confirmed: [], pending: [] };
    asset[entry.status].push(entry);
    assets.set(assetId, asset);
  }
  let unreadable = 0;
  const rows = [...assets].flatMap(([assetId, { confirmed, pending }]) => {
    const kept = confirmed.length > 0 ? confirmed : pending;
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
  const isNative = (row: AccountAssetBalance) => row.assetId === descriptor.network;
  rows.sort((a, b) => Number(isNative(b)) - Number(isNative(a)));
  return { rows, unmapped, unreadable };
}
