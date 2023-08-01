import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { MappedAsset, CurrenciesByProviderId } from "./type";

const groupCurrenciesByProvider = (
  assets: MappedAsset[],
  currenciesSupported: CryptoOrTokenCurrency[],
) => {
  const assetsByLedgerId: Record<string, MappedAsset> = {};
  for (const asset of assets) {
    assetsByLedgerId[asset.ledgerId] = asset;
  }
  const assetsByProviderId: Record<string, CurrenciesByProviderId> = {};
  for (const ledgerCurrency of currenciesSupported) {
    const asset = assetsByLedgerId[ledgerCurrency.id];
    if (asset) {
      if (!assetsByProviderId[asset.providerId]) {
        assetsByProviderId[asset.providerId] = {
          providerId: asset.providerId,
          currenciesByNetwork: [],
        };
      }
      assetsByProviderId[asset.providerId].currenciesByNetwork.push(ledgerCurrency);
    }
  }
  return Object.values(assetsByProviderId);
};

const searchByProviderId = (list: MappedAsset[], providerId: string) =>
  list.filter(elem => elem.providerId.toLowerCase() === providerId.toLowerCase());

const searchByNameOrTicker = (list: MappedAsset[], nameOrTicker: string) =>
  list.filter(
    elem =>
      elem.name.toLowerCase().includes(nameOrTicker.toLowerCase()) ||
      elem.ticker.toLowerCase().includes(nameOrTicker.toLowerCase()),
  );

export { searchByProviderId, searchByNameOrTicker, groupCurrenciesByProvider };
