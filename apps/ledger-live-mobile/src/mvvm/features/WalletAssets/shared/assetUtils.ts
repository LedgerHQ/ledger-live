import { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/types";
import { Asset } from "~/types/asset";

export const toAsset = (item: CategorizedAssetItem): Asset => ({
  currency: item.currency,
  accounts: item.accounts,
  amount: item.balance,
  distribution: item.distribution,
  isPlaceholder: false,
});

/**
 * Pads `owned` with items from `defaults` (deduped by currency id) up to `max` total.
 */
export function padAssetsWithDefaults(owned: Asset[], defaults: Asset[], max: number): Asset[] {
  if (owned.length >= max) return owned;
  const ownedIds = new Set(owned.map(a => a.currency.id));
  const padding = defaults.filter(p => !ownedIds.has(p.currency.id)).slice(0, max - owned.length);
  return [...owned, ...padding];
}
