import type {
  CategorizedAssets,
  CategorizedAssetItem,
} from "@ledgerhq/asset-aggregation/assetCategorization/types";
import type { CryptoVariant } from "./types";

export function selectAssetList(
  categorizedAssets: CategorizedAssets & { stocks?: CategorizedAssetItem[] },
  variant: CryptoVariant,
) {
  if (variant === "stablecoin") {
    return categorizedAssets.stablecoins ?? [];
  }
  if (variant === "crypto") {
    return categorizedAssets.cryptos ?? [];
  }
  if (variant === "stocks") {
    return categorizedAssets.stocks ?? [];
  }
  return [
    ...(categorizedAssets.cryptos ?? []),
    ...(categorizedAssets.stablecoins ?? []),
    ...(categorizedAssets.stocks ?? []),
  ];
}
