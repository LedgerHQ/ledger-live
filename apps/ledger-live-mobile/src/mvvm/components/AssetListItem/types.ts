export interface MarketAssetDisplayData {
  id: string;
  name: string;
  ticker: string;
  ledgerIds: string[];
  formattedMarketCap: string;
  marketcapRank: number;
  formattedPrice: string;
  priceChangePercentage: number;
}
