import network from "@ledgerhq/live-network";
import { getEnv } from "@ledgerhq/live-env";
import type { CurrenciesPerProvider, RampCatalog } from "../types";
import mockData from "./mock.json";

const api = {
  fetchRampCatalog: async (): Promise<RampCatalog> => {
    if (getEnv("MOCK")) {
      // TODO: replace this mock on playwright runs with controlled data
      return mockData as RampCatalog;
    }

    const headers = { Origin: "http://localhost:3000" };
    const currencyParam = "currency=crypto";

    const [buyResult, sellResult] = await Promise.allSettled([
      network<{
        onRamp: CurrenciesPerProvider;
      }>({
        method: "GET",
        headers,
        url: `${getEnv("BUY_API_BASE")}/provider/currencies?${currencyParam}`,
      }),
      network<CurrenciesPerProvider>({
        method: "GET",
        headers,
        url: `${getEnv("SELL_API_BASE")}/provider/currencies?${currencyParam}`,
      }),
    ]);

    if (buyResult.status === "rejected" && sellResult.status === "rejected") {
      throw new Error("Failed to fetch ramp catalog from both buy and sell APIs");
    }

    const buyData = buyResult.status === "fulfilled" ? buyResult.value.data : undefined;
    const sellData = sellResult.status === "fulfilled" ? sellResult.value.data : undefined;

    return {
      onRamp: buyData?.onRamp ?? {},
      offRamp: sellData ?? {},
    };
  },
};

export default api;
