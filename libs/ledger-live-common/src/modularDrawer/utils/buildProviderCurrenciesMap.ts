import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export const buildProviderCurrenciesMap = (
  currenciesByProvider?: Array<{
    providerId: string;
    currenciesByNetwork?: CryptoOrTokenCurrency[];
  }>,
) => {
  if (!currenciesByProvider?.length) return null;

  const map = new Map<
    string,
    { mainCurrency: CryptoOrTokenCurrency; currencies: CryptoOrTokenCurrency[] }
  >();

  currenciesByProvider.forEach(({ providerId, currenciesByNetwork = [] }) => {
    if (currenciesByNetwork.length > 0) {
      const mainCurrency =
        currenciesByNetwork.find(c => c.id === providerId) ?? currenciesByNetwork[0];
      map.set(providerId, { mainCurrency, currencies: currenciesByNetwork });
    }
  });

  return map;
};
