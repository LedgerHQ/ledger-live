import type { BalanceHistoryPoint } from "@domain/api-account-portfolio";
import {
  AssetBalanceHistorySchema,
  type AssetBalanceHistory,
} from "@domain/entity-account-balance-history";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";

/** `unmapped`: token points with no CAL id, left out. `unreadable`: assets with a point that could not be read. */
export type MappedHistory = { series: AssetBalanceHistory[]; unmapped: number; unreadable: number };

const assetIdOf = (descriptor: AccountDescriptor, point: BalanceHistoryPoint) =>
  point.asset === "native" ? descriptor.network : (point.cal_id ?? undefined);

const timeOf = (point: BalanceHistoryPoint) => new Date(point.time).getTime();

/** One series per asset, native coin first, each oldest point first. */
export function toAssetHistories(
  descriptor: AccountDescriptor,
  points: readonly BalanceHistoryPoint[],
): MappedHistory {
  const assets = new Map<string, BalanceHistoryPoint[]>();
  let unmapped = 0;
  for (const point of points) {
    const assetId = assetIdOf(descriptor, point);
    if (assetId === undefined) {
      unmapped += 1;
      continue;
    }
    const own = assets.get(assetId);
    if (own) own.push(point);
    else assets.set(assetId, [point]);
  }
  let unreadable = 0;
  const series = [...assets].flatMap(([assetId, own]) => {
    const sorted = [...own].sort((a, b) => timeOf(a) - timeOf(b));
    const parsed = AssetBalanceHistorySchema.safeParse({
      assetId,
      points: sorted.map(point => ({
        date: Number.isNaN(timeOf(point)) ? point.time : new Date(point.time).toISOString(),
        balance: point.value,
      })),
    });
    if (parsed.success) return [parsed.data];
    unreadable += 1;
    return [];
  });
  const isNative = (each: AssetBalanceHistory) => each.assetId === descriptor.network;
  series.sort((a, b) => Number(isNative(b)) - Number(isNative(a)));
  return { series, unmapped, unreadable };
}
