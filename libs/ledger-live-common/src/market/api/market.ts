import network from "@ledgerhq/live-network";
import { getEnv } from "@ledgerhq/live-env";
import {
  MarketCurrencyChartDataRequestParams,
  MarketCoinDataChart,
  MarketChartApiResponse,
} from "../utils/types";
import { rangeDataTable } from "../utils/rangeDataTable";
import URL from "url";

const baseURL = getEnv("MARKET_API_URL");

// Fetches list of supported counterCurrencies
export async function supportedCounterCurrencies(): Promise<string[]> {
  const url = `${baseURL}/simple/supported_vs_currencies`;

  const { data } = await network<string[]>({
    method: "GET",
    url,
  });

  return data;
}

export async function fetchCurrencyChartData({
  id,
  counterCurrency,
  range = "24h",
}: MarketCurrencyChartDataRequestParams): Promise<MarketCoinDataChart> {
  const { days, interval } = rangeDataTable[range];

  const url = URL.format({
    pathname: `${baseURL}/coins/${id}/market_chart`,
    query: {
      vs_currency: counterCurrency,
      days,
      interval,
    },
  });

  const { data } = await network<MarketChartApiResponse>({
    method: "GET",
    url,
  });

  return { [range]: data.prices };
}
