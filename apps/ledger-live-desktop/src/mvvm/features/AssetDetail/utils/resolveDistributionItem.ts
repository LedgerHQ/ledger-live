import type { DistributionItem } from "@ledgerhq/types-live";
import { toSlug } from "@ledgerhq/asset-aggregation/assetDistribution/toSlug";

export type DistributionLookup = {
  bySlug?: Record<string, DistributionItem>;
  list: DistributionItem[];
};

export type MarketStateSlice = { ledgerIds?: string[] } | undefined;

export type ResolveDistributionItemParams = {
  routeAssetId: string | undefined;
  decodedAssetId: string | undefined;
  marketState: MarketStateSlice;
  distribution: DistributionLookup;
};

export function resolveDistributionItem({
  routeAssetId,
  decodedAssetId,
  marketState,
  distribution,
}: ResolveDistributionItemParams): DistributionItem | undefined {
  if (!routeAssetId) return undefined;

  const decoded = decodedAssetId ?? routeAssetId;
  const marketLedgerId = marketState?.ledgerIds?.[0];
  const targetIds = new Set([decoded, marketLedgerId].filter((id): id is string => id != null));

  return (
    distribution.bySlug?.[decoded] ??
    (marketLedgerId ? distribution.bySlug?.[toSlug(marketLedgerId)] : undefined) ??
    distribution.list.find(item => targetIds.has(item.currency.id))
  );
}
