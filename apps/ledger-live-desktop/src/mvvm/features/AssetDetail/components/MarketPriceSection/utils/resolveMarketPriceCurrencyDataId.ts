import type { DistributionItem } from "@ledgerhq/types-live";
import { dadaIdToMarketId } from "@ledgerhq/live-common/market/utils/index";

/**
 * Single resolution path for `/v3/markets` `ids=` — normalizes DADA-style ids once.
 * Prefers explicit `marketAssetId` (from route / market info) over distribution fallbacks.
 */
export function resolveMarketPriceCurrencyDataId(
  marketAssetId: string | undefined,
  distributionItem: DistributionItem | undefined,
): string | undefined {
  const normalize = (id: string | undefined): string | undefined => {
    if (id == null || id === "") return undefined;
    return dadaIdToMarketId(id);
  };
  return (
    normalize(marketAssetId) ??
    normalize(distributionItem?.marketId) ??
    normalize(distributionItem?.currency.id)
  );
}
