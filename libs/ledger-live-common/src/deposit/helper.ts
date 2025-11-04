import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { MappedAsset, CurrenciesByProviderId, GroupedCurrencies } from "./type";
import {
  currenciesByMarketcap,
  getCryptoCurrencyById,
  findTokenById,
  hasCryptoCurrencyId,
} from "../currencies";
import { getMappedAssets } from "./api";

/**
 * WORKAROUND: Fallback mappings for currencies not yet available in getMappedAssets()
 * TODO: Remove these entries once they are properly supported by the mapping service
 *
 * Each entry maps a Ledger currency ID to its provider ID.
 * The provider ID is used to group currencies by their external provider (e.g., CoinGecko).
 */
const FALLBACK_CURRENCY_MAPPINGS: Record<string, string> = {
  // Canton Network - using canton_network as both ledgerId and providerId
  canton_network: "canton_network",
  canton_network_devnet: "canton_network_devnet",
  canton_network_testnet: "canton_network_testnet",

  // Add more fallback mappings here as needed:
  // "ledger_currency_id": "provider_id",
};

/**
 * Creates synthetic MappedAsset entries for currencies that are not yet available
 * in the mapping service API but need to be supported.
 */
const createFallbackMappedAssets = (
  currencies: CryptoOrTokenCurrency[],
  existingAssets: MappedAsset[],
): MappedAsset[] => {
  const existingLedgerIds = new Set(existingAssets.map(asset => asset.ledgerId.toLowerCase()));
  const fallbackAssets: MappedAsset[] = [];

  for (const [currencyId, providerId] of Object.entries(FALLBACK_CURRENCY_MAPPINGS)) {
    // Skip if currency already exists in mapped assets
    if (existingLedgerIds.has(currencyId.toLowerCase())) {
      continue;
    }

    // Find the currency in the list
    const currency = currencies.find(c => c.id === currencyId);
    if (currency) {
      fallbackAssets.push({
        $type: currency.type === "TokenCurrency" ? "Token" : "Coin",
        ledgerId: currency.id,
        providerId: providerId,
        name: currency.name,
        ticker: currency.ticker,
        network: currency.type === "TokenCurrency" ? currency.parentCurrency?.id : undefined,
        contract: currency.type === "TokenCurrency" ? currency.contractAddress : undefined,
        status: "active",
        reason: null,
        data: {
          img: "",
          marketCapRank: null,
        },
        ledgerCurrency: currency,
      });
    }
  }

  return fallbackAssets;
};

export const loadCurrenciesByProvider = async (
  coinsAndTokensSupported: CryptoOrTokenCurrency[],
): Promise<GroupedCurrencies> => {
  const [sortedCurrenciesSupported, assets] = await Promise.all([
    currenciesByMarketcap(coinsAndTokensSupported),
    getMappedAssets(),
  ]);

  // Merge API assets with fallback assets for currencies not yet in the API
  const fallbackAssets = createFallbackMappedAssets(sortedCurrenciesSupported, assets);
  const allAssets = [...assets, ...fallbackAssets];

  return groupCurrenciesByProvider(allAssets, sortedCurrenciesSupported);
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
    const elem = firstCrypto ?? currenciesByNetwork.find(c => c.type === "TokenCurrency");
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

export const getTokenOrCryptoCurrencyById = (id: string): CryptoOrTokenCurrency => {
  if (hasCryptoCurrencyId(id)) {
    return getCryptoCurrencyById(id);
  }
  const token = findTokenById(id);
  if (!token) {
    throw new Error(`token with id "${id}" not found`);
  }
  return token;
};
