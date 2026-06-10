import { z } from "zod";
import { PortfolioRange } from "@ledgerhq/types-live";

export enum MarketDataTags {
  Performers = "Performers",
  CurrencyData = "CurrencyData",
  ChartData = "ChartData",
  GlobalData = "GlobalData",
  TrendingCategories = "TrendingCategories",
}

export interface MarketPerformersQueryParams {
  counterCurrency: string;
  range: PortfolioRange;
  limit?: number;
  top?: number;
  sort: "asc" | "desc";
  supported: boolean;
}

export const MarketChartApiResponseSchema = z.object({
  values: z.array(z.tuple([z.number(), z.number()])),
});

export type MarketChartApiResponse = z.infer<typeof MarketChartApiResponseSchema>;

// Raw /v3/markets/global response: percentageChanges values are ratios (e.g. -0.0171 = -1.71%).
export const GlobalMarketDataResponseSchema = z.object({
  marketCap: z.number(),
  percentageChanges: z.object({
    "1d": z.number(),
  }),
});

export type GlobalMarketDataResponse = z.infer<typeof GlobalMarketDataResponseSchema>;

export interface GlobalMarketDataRequestParams {
  counterCurrency: string;
}

export interface GlobalMarketData {
  marketCap: number;
  // 24h change expressed as a percentage (e.g. -1.71), ready for display.
  changePercentage24h: number;
}

// Raw /v3/categories/trending response: a list of { id, name } categories.
export const TrendingCategoriesResponseSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
  }),
);

export type MarketTrendingCategory = z.infer<typeof TrendingCategoriesResponseSchema>[number];
