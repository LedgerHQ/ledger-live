import { CategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/types";
import { CryptoVariant } from "./types";

export function selectAssetList(categorizedAssets: CategorizedAssets, variant: CryptoVariant) {
  if (variant === "stablecoin") {
    return categorizedAssets.stablecoins ?? [];
  }
  if (variant === "crypto") {
    return categorizedAssets.cryptos ?? [];
  }
  return [...(categorizedAssets.cryptos ?? []), ...(categorizedAssets.stablecoins ?? [])];
}
