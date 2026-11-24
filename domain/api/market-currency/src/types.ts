/**
 * Raw `/v3/markets` item. There is no runtime schema for it: the legacy client trusted the shape, and
 * so does this package, so a field change is caught by the types only.
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

export type MarketCurrencyRequestParams = {
  id?: string;
  counterCurrency?: string;
  /** Ledger currency ids to resolve via the `/v3/markets` `ledgerIds` filter. */
  ledgerIds?: string[];
};

export type MarketsByLedgerIdsQueryParams = {
  ledgerIds: string[];
  counterCurrency: string;
};
