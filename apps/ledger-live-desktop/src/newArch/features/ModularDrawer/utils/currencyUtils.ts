import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getTokenOrCryptoCurrencyById } from "@ledgerhq/live-common/deposit/helper";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/helpers";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";

export type ProviderCoverageMap = Map<string, Set<string>>;

export const safeCurrencyLookup = (id: string): CryptoOrTokenCurrency | null => {
  try {
    return getTokenOrCryptoCurrencyById(id);
  } catch {
    return null;
  }
};

export const isProviderToken = (currency: CryptoOrTokenCurrency, providerId: string): boolean => {
  return isTokenCurrency(currency) && currency.id.toLowerCase().includes(providerId.toLowerCase());
};

export const getProviderCurrency = (
  provider: CurrenciesByProviderId,
): CryptoOrTokenCurrency | null => {
  const providerToken = provider.currenciesByNetwork.find(currency => {
    return isProviderToken(currency, provider.providerId);
  });

  if (providerToken) {
    return providerToken;
  }

  return safeCurrencyLookup(provider.providerId) ?? provider.currenciesByNetwork[0];
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

export const extractProviderCurrencies = (
  providers: CurrenciesByProviderId[],
): CryptoOrTokenCurrency[] => {
  return providers
    .map(provider => getProviderCurrency(provider))
    .filter((currency): currency is CryptoOrTokenCurrency => currency !== null);
};
