import network from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";
import {
  MarketCurrencyChartDataRequestParams,
  MarketListRequestParams,
  MarketPerformersParams,
  MarketItemResponse,
  SupportedCoins,
  MarketCurrencyRequestParams,
  MarketCoinDataChart,
} from "../utils/types";
import { rangeDataTable } from "../utils/rangeDataTable";
import URL from "url";
import { getRange } from "../utils/rangeFormatter";

const baseURL = () => getEnv("LEDGER_COUNTERVALUES_API");
const ROOT_PATH = getEnv("MARKET_API_URL");

export async function getSupportedCoinsList(): Promise<SupportedCoins> {
  const url = `${ROOT_PATH}/coins/list`;
  const { data } = await network({ method: "GET", url });
  return data;
}

// fetches currencies data for selected currencies ids
export async function fetchList({
  counterCurrency,
  limit = 50,
  page = 1,
  order = "desc",
  search = "",
  liveCoinsList = [],
  starred = [],
}: MarketListRequestParams): Promise<MarketItemResponse[]> {
  const url = URL.format({
    pathname: `${baseURL()}/v3/markets`,
    query: {
      page: page,
      pageSize: limit,
      to: counterCurrency,
      sort: "market-cap-rank",
      ...(search.length > 1 && { filter: search }),
      ...(starred.length > 1 && { ids: starred.join(",") }),
      ...(liveCoinsList.length > 1 && { ids: liveCoinsList.join(",") }),
    },
  });

  const { data } = await network({
    method: "GET",
    url,
  });

  return data;
}

// Fetches list of supported counterCurrencies
export async function supportedCounterCurrencies(): Promise<string[]> {
  const url = `${ROOT_PATH}/simple/supported_vs_currencies`;

  const { data } = await network({
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
    pathname: `${ROOT_PATH}/coins/${id}/market_chart`,
    query: {
      vs_currency: counterCurrency,
      days,
      interval,
    },
  });

  const { data } = await network({
    method: "GET",
    url,
  });

  return { [range]: data.prices };
}

export async function fetchCurrency({
  counterCurrency,
  name,
}: MarketCurrencyRequestParams): Promise<MarketItemResponse> {
  const url = URL.format({
    pathname: `${baseURL()}/v3/markets`,
    query: {
      to: counterCurrency,
      filter: name,
      pageSize: 1,
      limit: 1,
    },
  });

  const { data } = await network({ method: "GET", url });

  return data[0];
}

export async function fetchMarketPerformers({
  counterCurrency,
  range,
  limit = 5,
  top = 50,
  sort,
  supported,
}: MarketPerformersParams): Promise<MarketItemResponse[]> {
  const sortParam = `${sort === "asc" ? "positive" : "negative"}-price-change-${getRange(range)}`;

  const url = URL.format({
    pathname: `${baseURL()}/v3/markets`,
    query: {
      to: counterCurrency,
      limit,
      top,
      sort: sortParam,
      supported,
    },
  });

  const { data } = await network({ method: "GET", url });

  return data;
}
