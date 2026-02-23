import { z } from "zod";
import {
  MarketCoinSchema,
  SupportedCoinsSchema,
  MarketChartApiResponseSchema,
} from "../state-manager/types";

export type MarketCoin = z.infer<typeof MarketCoinSchema>;
export type SupportedCoins = z.infer<typeof SupportedCoinsSchema>;
export type MarketChartApiResponse = z.infer<typeof MarketChartApiResponseSchema>;

export type ChartDataPoint = [number, number];
export type MarketCoinDataChart = Record<string, Array<ChartDataPoint>>;

export type MarketCurrencyChartDataRequestParams = {
  id?: string;
  counterCurrency?: string;
  range?: string;
  lastRequestTime?: Date;
};
