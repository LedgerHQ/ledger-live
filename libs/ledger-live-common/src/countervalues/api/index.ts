import { getEnv } from "../../env";
import type { CounterValuesAPI } from "../types";
import prodAPI from "./api";
import mockAPI from "./api.mock";

const api: CounterValuesAPI = {
  fetchHistorical: (granularity, pair) =>
    getEnv("MOCK")
      ? mockAPI.fetchHistorical(granularity, pair)
      : prodAPI.fetchHistorical(granularity, pair),
  fetchLatest: (pairs) =>
    getEnv("MOCK") ? mockAPI.fetchLatest(pairs) : prodAPI.fetchLatest(pairs),
  fetchMarketcapTickers: () =>
    getEnv("MOCK")
      ? mockAPI.fetchMarketcapTickers()
      : prodAPI.fetchMarketcapTickers(),
};

export default api;
