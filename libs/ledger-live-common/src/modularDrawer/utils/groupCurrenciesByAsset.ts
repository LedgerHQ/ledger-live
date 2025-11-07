import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetData } from "./type";

export const groupCurrenciesByAsset = (assetsSorted: AssetData[]) => {
  const assetMap = new Map<
    string,
    { mainCurrency: CryptoOrTokenCurrency; currencies: CryptoOrTokenCurrency[] }
  >();

  if (assetsSorted) {
    for (const item of assetsSorted) {
      const {
        asset: { id: assetId },
        networks = [],
      } = item;
      if (networks.length > 0) {
        const mainCurrency = networks.find(c => c.id === assetId) ?? networks[0];
        assetMap.set(assetId, {
          mainCurrency,
          currencies: networks,
        });
      }
    }
  }

  return assetMap;
};
