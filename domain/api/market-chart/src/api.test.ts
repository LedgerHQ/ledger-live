import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import type { MarketChartRange } from "@domain/entity-market-chart";
import { marketChartApi } from "./api";

const CVS_URL = "https://cvs.test";
const CHART_URL = `${CVS_URL}/v3/markets/chart/:segment/:id`;
const SUPPORTED_URL = `${CVS_URL}/v3/supported/markets/chart/to`;

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Wired the way the apps wire it: the store registers the service api, and these endpoints only
// exist because importing this package injected them.
const makeStore = () =>
  configureStore({
    reducer: { [countervaluesApi.reducerPath]: countervaluesApi.reducer },
    middleware: gdm =>
      gdm({
        serializableCheck: false,
        thunk: { extraArgument: cvsApiExtra({ getCountervaluesServiceUrl: () => CVS_URL }) },
      }).concat(countervaluesApi.middleware),
  });

const VALUES = [
  [1779861598000, 1781.81],
  [1779861897000, 1782.65],
];

describe("marketChartApi configuration", () => {
  it("is the countervalues service api, mutated in place by injectEndpoints", () => {
    expect(marketChartApi).toBe(countervaluesApi);
    expect(marketChartApi.reducerPath).toBe("countervaluesApi");
  });
});

describe("getAssetChartData", () => {
  it.each<[MarketChartRange, string]>([
    ["1h", "1h"],
    ["24h", "1d"],
    ["day", "1d"],
    ["7d", "1w"],
    ["week", "1w"],
    ["30d", "1m"],
    ["6m", "6m"],
    ["1y", "1y"],
    ["5y", "5y"],
    ["all", "all"],
  ])("maps range '%s' to URL segment '%s'", async (range, segment) => {
    const seen: URL[] = [];
    server.use(
      http.get(CHART_URL, ({ request }) => {
        seen.push(new URL(request.url));
        return HttpResponse.json({ values: VALUES });
      }),
    );

    await makeStore().dispatch(
      marketChartApi.endpoints.getAssetChartData.initiate({ id: "bitcoin", range }),
    );

    expect(seen).toHaveLength(1);
    expect(seen[0].pathname).toBe(`/v3/markets/chart/${segment}/bitcoin`);
  });

  it("forwards the counter currency and keys the series by the requested range", async () => {
    const seen: URL[] = [];
    server.use(
      http.get(CHART_URL, ({ request }) => {
        seen.push(new URL(request.url));
        return HttpResponse.json({ values: VALUES });
      }),
    );

    const result = await makeStore().dispatch(
      marketChartApi.endpoints.getAssetChartData.initiate({
        id: "bitcoin",
        counterCurrency: "eur",
        range: "7d",
      }),
    );

    expect(seen[0].searchParams.get("to")).toBe("eur");
    expect(result.data).toEqual({ "7d": VALUES });
  });

  it("defaults to the 24h range when none is given", async () => {
    server.use(http.get(CHART_URL, () => HttpResponse.json({ values: VALUES })));

    const result = await makeStore().dispatch(
      marketChartApi.endpoints.getAssetChartData.initiate({ id: "bitcoin" }),
    );

    expect(result.data).toEqual({ "24h": VALUES });
  });

  it("surfaces an error when the payload does not match the schema", async () => {
    server.use(http.get(CHART_URL, () => HttpResponse.json({ values: [["not-a-number", 1]] })));

    const result = await makeStore().dispatch(
      marketChartApi.endpoints.getAssetChartData.initiate({ id: "bitcoin" }),
    );

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("does not retry a failed request", async () => {
    let hits = 0;
    server.use(
      http.get(CHART_URL, () => {
        hits += 1;
        return HttpResponse.json({}, { status: 500 });
      }),
    );

    const result = await makeStore().dispatch(
      marketChartApi.endpoints.getAssetChartData.initiate({ id: "bitcoin" }),
    );

    expect(result.error).toBeDefined();
    expect(hits).toBe(1);
  });
});

describe("getSupportedChartCounterCurrencies", () => {
  it("lowercases every supported counter currency", async () => {
    server.use(http.get(SUPPORTED_URL, () => HttpResponse.json(["EUR", "bitcoin", "USD"])));

    const result = await makeStore().dispatch(
      marketChartApi.endpoints.getSupportedChartCounterCurrencies.initiate(),
    );

    expect(result.data).toEqual(["eur", "bitcoin", "usd"]);
  });

  it("surfaces an error when an entry is an empty string", async () => {
    server.use(http.get(SUPPORTED_URL, () => HttpResponse.json(["eur", ""])));

    const result = await makeStore().dispatch(
      marketChartApi.endpoints.getSupportedChartCounterCurrencies.initiate(),
    );

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});
