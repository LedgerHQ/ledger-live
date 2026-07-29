import type { AssetsData } from "../../dada-client/entities";
import type { AssetData } from "./type";

type BuildAssetsSortedOptions = Readonly<{
  includeMetaCurrencyId?: boolean;
  networkIds?: readonly string[];
}>;

export function buildAssetsSorted(
  data: AssetsData,
  { includeMetaCurrencyId = false, networkIds }: BuildAssetsSortedOptions = {},
): AssetData[] {
  const allowedNetworkIds = networkIds === undefined ? undefined : new Set(networkIds);

  return data.currenciesOrder.metaCurrencyIds.flatMap(metaCurrencyId => {
    const asset = data.cryptoAssets[metaCurrencyId];
    if (!asset) return [];

    const assetIdEntries = Object.entries(asset.assetsIds).filter(
      ([networkId]) => allowedNetworkIds?.has(networkId) ?? true,
    );
    const networks = assetIdEntries.flatMap(([, assetId]) => {
      const currency = data.cryptoOrTokenCurrencies[assetId];
      return currency ? [currency] : [];
    });
    const firstCurrency = networks[0];
    if (!firstCurrency) return [];

    return [
      {
        asset: {
          ...asset,
          id: firstCurrency.id,
          ...(includeMetaCurrencyId ? { metaCurrencyId } : {}),
          assetsIds: Object.fromEntries(assetIdEntries),
        },
        networks,
        interestRates: data.interestRates?.[firstCurrency.id],
        market: data.markets?.[firstCurrency.id],
      },
    ];
  });
}
