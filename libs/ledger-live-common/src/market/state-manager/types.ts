import { z } from "zod";
import { PortfolioRange } from "@ledgerhq/types-live";

export enum MarketDataTags {
  Performers = "Performers",
  CurrencyData = "CurrencyData",
  ChartData = "ChartData",
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
