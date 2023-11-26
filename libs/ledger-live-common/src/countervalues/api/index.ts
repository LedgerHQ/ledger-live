import { getEnv } from "@ledgerhq/live-env";
import type { CounterValuesAPI } from "../types";
import prodAPI from "./api";
import mockAPI from "./api.mock";

const api: CounterValuesAPI = {
  fetchHistorical: (granularity, pair) =>
    getEnv("MOCK_COUNTERVALUES")
      ? mockAPI.fetchHistorical(granularity, pair)
      : prodAPI.fetchHistorical(granularity, pair),
  fetchLatest: pairs =>
    getEnv("MOCK_COUNTERVALUES") ? mockAPI.fetchLatest(pairs) : prodAPI.fetchLatest(pairs),
  fetchIdsSortedByMarketcap: () =>
    getEnv("MOCK_COUNTERVALUES")
      ? mockAPI.fetchIdsSortedByMarketcap()
      : prodAPI.fetchIdsSortedByMarketcap(),
};

export default api;
