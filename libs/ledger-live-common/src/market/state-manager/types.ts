import { PortfolioRange } from "@ledgerhq/types-live";

export enum MarketDataTags {
  Performers = "Performers",
  CurrencyData = "CurrencyData",
}

export interface MarketPerformersQueryParams {
  counterCurrency: string;
  range: PortfolioRange;
  limit?: number;
  top?: number;
  sort: "asc" | "desc";
  supported: boolean;
}
