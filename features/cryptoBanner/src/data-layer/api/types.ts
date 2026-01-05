export enum AssetsAdditionalData {
  Apy = "apy",
  MarketTrend = "marketTrend",
}

export interface TopCrypto {
  id: string;
  ticker: string;
  name: string;
  price?: number;
  priceChangePercentage24h?: number;
  marketCapRank?: number;
}

export interface GetTopCryptosParams {
  product: "llm" | "lld";
  version: string;
  isStaging?: boolean;
}
