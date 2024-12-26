import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { MappedAsset, CurrenciesByProviderId, GroupedCurrencies } from "./type";
import { currenciesByMarketcap } from "../currencies";
import { getMappedAssets } from "./api";

export const loadCurrenciesByProvider = async (
  coinsAndTokensSupported: CryptoOrTokenCurrency[],
): Promise<GroupedCurrencies> => {
  const [sortedCurrenciesSupported, assets] = await Promise.all([
    currenciesByMarketcap(coinsAndTokensSupported),
    getMappedAssets(),
  ]);
  return groupCurrenciesByProvider(assets, sortedCurrenciesSupported);
};

export const groupCurrenciesByProvider = (
  assets: MappedAsset[],
  sortedCurrencies: CryptoOrTokenCurrency[],
): GroupedCurrencies => {
  const assetsByLedgerId: Map<string, MappedAsset> = new Map();
  for (const asset of assets) {
    /// FIXME(LIVE-10508) drop usage of toLowerCase
    assetsByLedgerId.set(asset.ledgerId.toLowerCase(), asset);
  }
  const assetsByProviderId: Map<string, CurrenciesByProviderId> = new Map();
  const sortedCryptoCurrencies: CryptoOrTokenCurrency[] = [];
  // iterate over currencies by preserving their order
  for (const ledgerCurrency of sortedCurrencies) {
    /// FIXME(LIVE-10508) drop usage of toLowerCase
    const asset = assetsByLedgerId.get(ledgerCurrency.id.toLowerCase());
    if (asset) {
      // we only yield the intersection of currencies and mapped assets
      const existingEntry = assetsByProviderId.get(asset.providerId);
      if (!existingEntry) {
        assetsByProviderId.set(asset.providerId, {
          providerId: asset.providerId,
          currenciesByNetwork: [ledgerCurrency],
        });
      } else {
        existingEntry.currenciesByNetwork.push(ledgerCurrency);
      }
    }
  }

  // in this case, the first currency of the provider is the one we want to display (Wasn't true)
  // So we need to take the first crypto or token currency of each provider to fix that
  for (const [, { currenciesByNetwork }] of assetsByProviderId.entries()) {
    const firstCrypto = currenciesByNetwork.find(c => c.type === "CryptoCurrency");
    const elem = firstCrypto || currenciesByNetwork.find(c => c.type === "TokenCurrency");
    if (elem) {
      sortedCryptoCurrencies.push(elem);
    }
  }

  return {
    currenciesByProvider: Array.from(assetsByProviderId.values()),
    sortedCryptoCurrencies,
  };
};

export const searchByProviderId = (list: MappedAsset[], providerId: string) =>
  list.filter(elem => elem.providerId.toLowerCase() === providerId.toLowerCase());

export const searchByNameOrTicker = (list: MappedAsset[], nameOrTicker: string) =>
  list.filter(
    elem =>
      elem.name.toLowerCase().includes(nameOrTicker.toLowerCase()) ||
      elem.ticker.toLowerCase().includes(nameOrTicker.toLowerCase()),
  );
