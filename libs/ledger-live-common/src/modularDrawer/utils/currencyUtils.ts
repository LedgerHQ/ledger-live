import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrenciesByProviderId } from "../../deposit/type";

export type ProviderCoverageMap = Map<string, Set<string>>;

export const getProviderCurrency = (
  provider: CurrenciesByProviderId,
): CryptoOrTokenCurrency | null => {
  // First, try to find a currency that matches the providerId exactly
  const exactMatch = provider.currenciesByNetwork.find(
    currency => currency.id === provider.providerId,
  );
  if (exactMatch) {
    return exactMatch;
  }
  console.warn("MAD: no exact match found for provider", provider.providerId);
  // fall back to the first currency in the network
  return provider.currenciesByNetwork[0];
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
    .map(getProviderCurrency)
    .filter((currency): currency is CryptoOrTokenCurrency => currency !== null);
};
