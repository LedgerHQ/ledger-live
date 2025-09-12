import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getTokenOrCryptoCurrencyById } from "../../deposit/helper";
import { isTokenCurrency } from "../../currencies";
import { CurrenciesByProviderId } from "../../deposit/type";

export type ProviderCoverageMap = Map<string, Set<string>>;

export const safeCurrencyLookup = async (id: string): Promise<CryptoOrTokenCurrency | null> => {
  try {
    return await getTokenOrCryptoCurrencyById(id);
  } catch {
    return null;
  }
};

export const isProviderToken = (currency: CryptoOrTokenCurrency, providerId: string): boolean => {
  return isTokenCurrency(currency) && currency.id.toLowerCase().includes(providerId.toLowerCase());
};

export const getProviderCurrency = async (
  provider: CurrenciesByProviderId,
): Promise<CryptoOrTokenCurrency | null> => {
  const providerToken = provider.currenciesByNetwork.find(currency => {
    return isProviderToken(currency, provider.providerId);
  });

  if (providerToken) {
    return providerToken;
  }

  const lookupResult = await safeCurrencyLookup(provider.providerId);
  return lookupResult ?? provider.currenciesByNetwork[0];
};

export const buildProviderCoverageMap = (
  providers: CurrenciesByProviderId[],
): ProviderCoverageMap => {
  const providerIdToCoveringProviders = new Map<string, Set<string>>();

  for (const { providerId, currenciesByNetwork } of providers) {
    for (const { id } of currenciesByNetwork) {
      if (!providerIdToCoveringProviders.has(id)) {
        providerIdToCoveringProviders.set(id, new Set());
      }
      providerIdToCoveringProviders.get(id)!.add(providerId);
    }
  }

  return providerIdToCoveringProviders;
};

export const filterProvidersByIds = (
  providers: CurrenciesByProviderId[],
  currencyIdsSet: Set<string>,
  providerCoverageMap: ProviderCoverageMap,
): CurrenciesByProviderId[] => {
  const filtered: CurrenciesByProviderId[] = [];

  for (const provider of providers) {
    const filteredCurrencies = provider.currenciesByNetwork.filter(currency =>
      currencyIdsSet.has(currency.id),
    );

    if (filteredCurrencies.length === 0) continue;

    const providerHasOwnCurrency = provider.currenciesByNetwork.some(
      currency => currency.id === provider.providerId,
    );

    if (!providerHasOwnCurrency) {
      const coveringProviders = providerCoverageMap.get(provider.providerId);
      const isProviderIdCoveredElsewhere = coveringProviders && coveringProviders.size > 1;

      if (isProviderIdCoveredElsewhere) continue;
    }

    if (filteredCurrencies.length === provider.currenciesByNetwork.length) {
      filtered.push(provider);
    } else {
      filtered.push({
        ...provider,
        currenciesByNetwork: filteredCurrencies,
      });
    }
  }

  return filtered;
};

export const extractProviderCurrencies = async (
  providers: CurrenciesByProviderId[],
): Promise<CryptoOrTokenCurrency[]> => {
  const currencies = await Promise.all(providers.map(provider => getProviderCurrency(provider)));
  return currencies.filter((currency): currency is CryptoOrTokenCurrency => currency !== null);
};
