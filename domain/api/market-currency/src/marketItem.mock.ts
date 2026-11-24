import type { MarketItemResponse } from "./types";

/** A raw `/v3/markets` item for app MSW handlers and tests. Override any field. */
export function mockMarketItemResponse(
  overrides: Partial<MarketItemResponse> = {},
): MarketItemResponse {
  return {
    allTimeHigh: 69000,
    allTimeHighDate: "2021-11-10T14:24:11.000Z",
    allTimeLow: 67.81,
    allTimeLowDate: "2013-07-06T00:00:00.000Z",
    circulatingSupply: 19_800_000,
    fullyDilutedValuation: 1_300_000_000_000,
    high24h: 64_200,
    currencyId: "bitcoin",
    id: "bitcoin",
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    ledgerIds: ["bitcoin"],
    low24h: 62_100,
    marketCap: 1_250_000_000_000,
    marketCapChange24h: -12_000_000_000,
    marketCapChangePercentage24h: -0.95,
    marketCapRank: 1,
    maxSupply: 21_000_000,
    name: "Bitcoin",
    price: 63_250,
    priceChange24h: -410,
    priceChangePercentage1h: 0.12,
    priceChangePercentage24h: -0.64,
    priceChangePercentage30d: 4.3,
    priceChangePercentage7d: 1.9,
    priceChangePercentage6m: 12.4,
    priceChangePercentage1y: 48.2,
    ticker: "BTC",
    totalSupply: 21_000_000,
    totalVolume: 28_000_000_000,
    updatedAt: "2026-11-24T09:00:00.000Z",
    ...overrides,
  };
}
