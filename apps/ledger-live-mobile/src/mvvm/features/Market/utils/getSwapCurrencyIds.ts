import type { AssetsData } from "@domain/api-aggregated-assets";
import { selectAssetCurrencyIds } from "@features/platform-aggregated-assets";

export function getSwapCurrencyIds(
  data: AssetsData,
  currencyId: string,
  swappableCurrencyIds: readonly string[],
): string[] {
  const assetCurrencyIds = selectAssetCurrencyIds(data, currencyId);
  if (swappableCurrencyIds.length === 0) return assetCurrencyIds;

  const swappable = new Set(swappableCurrencyIds);
  return assetCurrencyIds.filter(id => swappable.has(id));
}
