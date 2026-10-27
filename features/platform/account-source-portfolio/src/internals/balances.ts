import type { BalanceEntry } from "@domain/api-account-portfolio";
import {
  AccountAssetBalanceSchema,
  type AccountAssetBalance,
} from "@domain/entity-account-balance";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";

/** What the service's entries of one account amount to, and the entries that could not be kept. */
export type MappedBalances = { rows: AccountAssetBalance[]; skipped: number };

/** Our asset id: the account's coin for `native`, the CAL id for a token; undefined without one. */
const assetIdOf = (descriptor: AccountDescriptor, entry: BalanceEntry) =>
  entry.asset === "native" ? descriptor.network : (entry.cal_id ?? undefined);

const sum = (parts: readonly BalanceEntry[]) =>
  parts.reduce((total, part) => total + BigInt(part.amount), 0n).toString();

/** One row per asset: the confirmed entries when there are some, the locked parts not spendable. */
export function toAccountBalances(
  descriptor: AccountDescriptor,
  entries: readonly BalanceEntry[],
): MappedBalances {
  const assets = new Map<string, { confirmed: BalanceEntry[]; pending: BalanceEntry[] }>();
  let skipped = 0;
  for (const entry of entries) {
    const assetId = assetIdOf(descriptor, entry);
    if (assetId === undefined || !/^\d+$/.test(entry.amount)) {
      skipped += 1;
      continue;
    }
    const asset = assets.get(assetId) ?? { confirmed: [], pending: [] };
    asset[entry.status].push(entry);
    assets.set(assetId, asset);
  }
  const rows = [...assets].flatMap(([assetId, { confirmed, pending }]) => {
    const kept = confirmed.length > 0 ? confirmed : pending;
    const parsed = AccountAssetBalanceSchema.safeParse({
      assetId,
      balance: sum(kept),
      spendableBalance: sum(kept.filter(part => !part.locked)),
    });
    if (parsed.success) return [parsed.data];
    skipped += kept.length;
    return [];
  });
  return { rows, skipped };
}
