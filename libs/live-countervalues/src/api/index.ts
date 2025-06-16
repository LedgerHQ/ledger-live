import { getEnv } from "@ledgerhq/live-env";
import type { CounterValuesAPI } from "../types";
import prodAPI from "./api";
import mockAPI from "./api.mock";

const api: CounterValuesAPI = {
  fetchHistorical: (granularity, pair, granularitiesRates) =>
    getEnv("MOCK_COUNTERVALUES")
      ? mockAPI.fetchHistorical(granularity, pair, granularitiesRates)
      : prodAPI.fetchHistorical(granularity, pair, granularitiesRates),
  fetchLatest: (pairs, batchStrategySolver) =>
    getEnv("MOCK_COUNTERVALUES")
      ? mockAPI.fetchLatest(pairs, batchStrategySolver)
      : prodAPI.fetchLatest(pairs, batchStrategySolver),
  fetchIdsSortedByMarketcap: () =>
    getEnv("MOCK_COUNTERVALUES")
      ? mockAPI.fetchIdsSortedByMarketcap()
      : prodAPI.fetchIdsSortedByMarketcap(),
};

export default api;
