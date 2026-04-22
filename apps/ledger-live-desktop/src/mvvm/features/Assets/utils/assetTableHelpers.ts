import type { AssetTableItem } from "../types";

export function sanitizeAssetNameForTestId(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^a-z0-9-]/g, "");
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
