import { RawApiResponse } from "../entities";

export const getAleoMockData = () => ({
  cryptoAssets: {
    aleo: {
      id: "aleo",
      ticker: "ALEO",
      name: "Aleo",
      assetsIds: {
        aleo: "aleo",
      },
    },
  },
  networks: {
    aleo: {
      id: "aleo",
      name: "Aleo",
    },
  },
  cryptoOrTokenCurrencies: {
    aleo: {
      type: "crypto_currency" as const,
      id: "aleo",
      name: "Aleo",
      ticker: "ALEO",
      units: [
        {
          code: "ALEO",
          name: "ALEO",
          magnitude: 6,
        },
      ],
      chainId: null,
      confirmationsNeeded: 6,
      symbol: "ALEO",
      coinType: 683,
      family: "aleo",
      hasSegwit: false,
      hasTokens: false,
      hrp: null,
      disableCountervalue: false,
    },
  },
  markets: {
    aleo: {
      currencyId: "aleo",
      marketCap: 1000000000,
      fullyDilutedValuation: 1500000000,
      totalVolume: 50000000,
      high24h: 1.1,
      low24h: 0.95,
      price: 1.0,
      priceChange24h: 0.05,
      priceChangePercentage1h: 0.5,
      priceChangePercentage24h: 5.0,
      priceChangePercentage7d: 10.0,
      priceChangePercentage30d: 15.0,
      priceChangePercentage1y: 100.0,
      marketCapChange24h: 50000000,
      marketCapChangePercentage24h: 5.0,
      circulatingSupply: 1000000000,
      totalSupply: 1000000000,
      allTimeHigh: 2.0,
      allTimeLow: 0.1,
      allTimeHighDate: new Date().toISOString(),
      allTimeLowDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      sparkline: Array.from({ length: 42 }, _ => 0.95 + Math.random() * 0.15),
      fetchAt: new Date().toISOString(),
    },
  },
});

export function injectAleoMockData(response: RawApiResponse): RawApiResponse {
  const aleoData = getAleoMockData();

  return {
    ...response,
    cryptoAssets: {
      ...response.cryptoAssets,
      ...aleoData.cryptoAssets,
    },
    networks: {
      ...response.networks,
      ...aleoData.networks,
    },
    cryptoOrTokenCurrencies: {
      ...response.cryptoOrTokenCurrencies,
      ...aleoData.cryptoOrTokenCurrencies,
    },
    currenciesOrder: {
      key: response.currenciesOrder.key,
      order: response.currenciesOrder.order,
      metaCurrencyIds: ["aleo", ...response.currenciesOrder.metaCurrencyIds],
    },
    markets: {
      ...response.markets,
      ...aleoData.markets,
    },
  };
}
