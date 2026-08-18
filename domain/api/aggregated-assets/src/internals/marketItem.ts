/*
 * Copied from libs/ledger-live-common/src/market/utils: a domain/* package cannot import libs/*.
 * TODO: a real market entity would delete this duplicate. Until then nothing detects drift —
 * PartialMarketItemResponse makes every field optional, so divergence never fails to compile.
 */
export type MarketItemResponse = {
  allTimeHigh: number;
  allTimeHighDate: string;
  allTimeLow: number;
  allTimeLowDate: string;
  circulatingSupply: number;
  fullyDilutedValuation: number;
  high24h: number;
  currencyId: string;
  id: string;
  image: string;
  ledgerIds: string[];
  low24h: number;
  marketCap: number;
  marketCapChange24h: number;
  marketCapChangePercentage24h: number;
  marketCapRank: number;
  maxSupply: number;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercentage1h: number;
  priceChangePercentage24h: number;
  priceChangePercentage30d: number;
  priceChangePercentage7d: number;
  priceChangePercentage6m?: number;
  priceChangePercentage1y: number;
  sparkline: number[];
  ticker: string;
  totalSupply: number;
  totalVolume: number;
  updatedAt: string;
};
