import type { AssetTableItem } from "../types";

/** @FIXME workaround for main tokens & also until we have asset aggregation */
export function resolveMarketId(id: string): string {
  if (!id.includes(":")) return id;
  const lastSegment = id.split(":").pop();
  return lastSegment?.replaceAll("_", "-") ?? id;
}

export function padItems(
  realItems: AssetTableItem[],
  defaults: AssetTableItem[],
  targetCount: number,
): AssetTableItem[] {
  if (realItems.length >= targetCount) return realItems;
  const ownedIds = new Set(realItems.map(item => item.currency.id));
  return [
    ...realItems,
    ...defaults.filter(d => !ownedIds.has(d.currency.id)).slice(0, targetCount - realItems.length),
  ];
}
