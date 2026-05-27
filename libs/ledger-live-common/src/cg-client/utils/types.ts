import { z } from "zod";
import { MarketCoinSchema, SupportedCoinsSchema } from "../state-manager/types";

export type MarketCoin = z.infer<typeof MarketCoinSchema>;
export type SupportedCoins = z.infer<typeof SupportedCoinsSchema>;

export type MarketChartApiResponse = {
  prices: Array<[number, number]>;
  market_caps: Array<[number, number]>;
  total_volumes: Array<[number, number]>;
};

export type ChartDataPoint = [number, number];
export type MarketCoinDataChart = Record<string, Array<ChartDataPoint>>;

export type MarketCurrencyChartDataRequestParams = {
  id?: string;
  counterCurrency?: string;
  range?: string;
  lastRequestTime?: Date;
};
