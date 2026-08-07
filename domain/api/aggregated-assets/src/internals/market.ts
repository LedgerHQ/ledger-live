/*
 * Copied from libs/ledger-live-common/src/market/utils rather than imported: a domain/* package
 * must not import legacy libs/*.
 *
 * TODO: replace with a real market entity when one exists. Until then note the drift risk —
 * every field of PartialMarketItemResponse is optional, so divergence from the original will
 * never produce a type error.
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

export type PartialMarketItemResponse = Partial<MarketItemResponse>;

/** Maps an aggregated-asset id such as "ethereum:erc20:usd_tether" to its market id. */
export function dadaIdToMarketId(id: string): string {
  if (!id.includes(":")) return id;
  const lastSegment = id.split(":").pop();
  return lastSegment?.replaceAll("_", "-") ?? id;
}
