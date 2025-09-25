import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetData } from "./type";

export const groupCurrenciesByProvider = (assetsSorted: AssetData[]) => {
  const assetMap = new Map<
    string,
    { mainCurrency: CryptoOrTokenCurrency; currencies: CryptoOrTokenCurrency[] }
  >();

  if (assetsSorted) {
    for (const item of assetsSorted) {
      const {
        asset: { id: providerId },
        networks = [],
      } = item;
      if (networks.length > 0) {
        const mainCurrency = networks.find(c => c.id === providerId) ?? networks[0];
        assetMap.set(providerId, {
          mainCurrency,
          currencies: networks,
        });
      }
    }
  }

  return assetMap;
};

export const groupCurrenciesByToken = (
  assetsSorted: AssetData[],
  selectedAssetId: string,
  networks: CryptoOrTokenCurrency[],
) => {
  const providerOfSelectedAsset = assetsSorted.find(provider =>
    provider.networks.some(currency => currency.id === selectedAssetId),
  );

  const pairs = networks.map(network => ({
    network,
    asset: providerOfSelectedAsset?.networks.find(currency =>
      currency.type === "TokenCurrency"
        ? currency.parentCurrency.id === network.id
        : currency.id === network.id,
    ),
  }));

  return pairs.filter(p => p.asset).map(p => p.asset!);
};
