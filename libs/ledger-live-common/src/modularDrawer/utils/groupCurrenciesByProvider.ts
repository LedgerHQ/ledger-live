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
      if (networks?.length > 0) {
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
