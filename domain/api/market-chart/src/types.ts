import type { MarketChartRange } from "@domain/entity-market-chart";

export type AssetChartDataRequestParams = {
  id?: string;
  counterCurrency: string;
  range?: MarketChartRange;
};
