import type { AssetTableItem } from "../types";
export { dadaIdToMarketId } from "@ledgerhq/live-common/market/utils/index";

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
