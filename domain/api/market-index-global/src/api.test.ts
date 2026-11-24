import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import { marketIndexGlobalApi, useGetGlobalMarketDataQuery } from "./api";
import { mockGlobalMarketDataResponse } from "./globalMarketData.mock";

const CVS_URL = "https://cvs.test";
const GLOBAL_URL = `${CVS_URL}/v3/markets/global`;

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Wired the way the apps wire it: the store registers the service api, and the endpoint only
// exists because importing this package injected it.
const makeStore = () =>
  configureStore({
    reducer: { [countervaluesApi.reducerPath]: countervaluesApi.reducer },
    middleware: gdm =>
      gdm({
        serializableCheck: false,
        thunk: { extraArgument: cvsApiExtra({ getCountervaluesServiceUrl: () => CVS_URL }) },
      }).concat(countervaluesApi.middleware),
  });

describe("marketIndexGlobalApi configuration", () => {
  it("is the countervalues service api, mutated in place by injectEndpoints", () => {
    expect(marketIndexGlobalApi).toBe(countervaluesApi);
    expect(marketIndexGlobalApi.reducerPath).toBe("countervaluesApi");
  });

  it("exposes the getGlobalMarketData endpoint and its hook", () => {
    expect(marketIndexGlobalApi.endpoints.getGlobalMarketData).toBeDefined();
    expect(useGetGlobalMarketDataQuery).toBeDefined();
  });
});

describe("getGlobalMarketData", () => {
  it("sends the counter currency as the `to` query param", async () => {
    const seen: URL[] = [];
    server.use(
      http.get(GLOBAL_URL, ({ request }) => {
        seen.push(new URL(request.url));
        return HttpResponse.json(mockGlobalMarketDataResponse);
      }),
    );

    await makeStore().dispatch(
      marketIndexGlobalApi.endpoints.getGlobalMarketData.initiate({ counterCurrency: "usd" }),
    );

    expect(seen).toHaveLength(1);
    expect(seen[0].pathname).toBe("/v3/markets/global");
    expect(seen[0].searchParams.get("to")).toBe("usd");
  });

  it("returns the transformed index", async () => {
    server.use(http.get(GLOBAL_URL, () => HttpResponse.json(mockGlobalMarketDataResponse)));

    const result = await makeStore().dispatch(
      marketIndexGlobalApi.endpoints.getGlobalMarketData.initiate({ counterCurrency: "usd" }),
    );

    expect(result.data?.marketCap).toBe(2_450_000_000_000);
    expect(result.data?.changePercentage24h).toBeCloseTo(-1.71);
  });

  it("surfaces an error when the response misses the 1d change", async () => {
    server.use(
      http.get(GLOBAL_URL, () => HttpResponse.json({ marketCap: 1, percentageChanges: {} })),
    );

    const result = await makeStore().dispatch(
      marketIndexGlobalApi.endpoints.getGlobalMarketData.initiate({ counterCurrency: "usd" }),
    );

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("does not retry a failed request", async () => {
    let hits = 0;
    server.use(
      http.get(GLOBAL_URL, () => {
        hits += 1;
        return HttpResponse.json({}, { status: 500 });
      }),
    );

    const result = await makeStore().dispatch(
      marketIndexGlobalApi.endpoints.getGlobalMarketData.initiate({ counterCurrency: "usd" }),
    );

    expect(result.error).toBeDefined();
    expect(hits).toBe(1);
  });
});
