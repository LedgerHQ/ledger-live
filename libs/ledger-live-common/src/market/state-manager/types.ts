import { PortfolioRange } from "@ledgerhq/types-live";

export enum MarketDataTags {
  Performers = "Performers",
}

export interface MarketPerformersQueryParams {
  counterCurrency: string;
  range: PortfolioRange;
  limit?: number;
  top?: number;
  sort: "asc" | "desc";
  supported: boolean;
}
