import network from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";
import type { RampCatalog } from "../types";
import mockData from "./mock.json";

const api = {
  fetchRampCatalog: async (): Promise<RampCatalog> => {
    if (getEnv("MOCK")) {
      // TODO: replace this mock on playwright runs with controlled data
      return mockData as RampCatalog;
    }

    const { data } = await network({
      method: "GET",
      headers: {
        Origin: "http://localhost:3000",
      },
      url: `${getEnv("BUY_API_BASE")}/provider/currencies?currency=crypto`,
    });
    return data as RampCatalog;
  },
};

export default api;
