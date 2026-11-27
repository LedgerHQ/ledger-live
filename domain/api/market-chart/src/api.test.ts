import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import type { MarketChartRange } from "@domain/entity-market-chart";
import { mockMarketChartApiResponse } from "@domain/entity-market-chart/schema.mock";
import {
  marketChartApi,
  useGetAssetChartDataQuery,
  useGetSupportedChartCounterCurrenciesQuery,
} from "./api";

const BASE = "https://cvs.test";
const CHART_URL = (segment: string, id = "bitcoin") => `${BASE}/v3/markets/chart/${segment}/${id}`;
const SUPPORTED_URL = `${BASE}/v3/supported/markets/chart/to`;

const makeStore = () =>
  configureStore({
    reducer: { [countervaluesApi.reducerPath]: countervaluesApi.reducer },
    middleware: gdm =>
      gdm({
        thunk: { extraArgument: cvsApiExtra({ getCountervaluesServiceUrl: () => BASE }) },
      }).concat(countervaluesApi.middleware),
  });

const fetchChart = (args: { id?: string; counterCurrency?: string; range?: MarketChartRange }) =>
  makeStore().dispatch(
    marketChartApi.endpoints.getAssetChartData.initiate({
      id: "bitcoin",
      counterCurrency: "usd",
      ...args,
    }),
  );

const fetchSupported = () =>
  makeStore().dispatch(marketChartApi.endpoints.getSupportedChartCounterCurrencies.initiate());

describe("marketChartApi configuration", () => {
  it("is the Countervalues service api, mutated in place by injectEndpoints", () => {
    expect(marketChartApi).toBe(countervaluesApi);
  });

  it("exposes the endpoints and their hooks", () => {
    expect(marketChartApi.endpoints.getAssetChartData).toBeDefined();
    expect(marketChartApi.endpoints.getSupportedChartCounterCurrencies).toBeDefined();
    expect(useGetAssetChartDataQuery).toBeDefined();
    expect(useGetSupportedChartCounterCurrenciesQuery).toBeDefined();
  });
});

describe("market chart endpoints", () => {
  const server = setupServer();
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe("getAssetChartData", () => {
    it.each<[MarketChartRange, string]>([
      ["1h", "1h"],
      ["1d", "1d"],
      ["24h", "1d"],
      ["day", "1d"],
      ["1w", "1w"],
      ["7d", "1w"],
      ["week", "1w"],
      ["1m", "1m"],
      ["30d", "1m"],
      ["month", "1m"],
      ["6m", "6m"],
      ["1y", "1y"],
      ["year", "1y"],
      ["5y", "5y"],
      ["all", "all"],
    ])("maps range %s to URL segment %s and keys the data by range", async (range, segment) => {
      server.use(
        http.get(CHART_URL(segment), () => HttpResponse.json(mockMarketChartApiResponse())),
      );

      const result = await fetchChart({ range });

      expect(result.data).toEqual({ [range]: mockMarketChartApiResponse().values });
    });

    it("defaults to the 24h range", async () => {
      server.use(http.get(CHART_URL("1d"), () => HttpResponse.json(mockMarketChartApiResponse())));

      const result = await fetchChart({});

      expect(result.data).toEqual({ "24h": mockMarketChartApiResponse().values });
    });

    it("forwards the counter currency and percent-encodes the id", async () => {
      let requestUrl = "";
      server.use(
        http.get(`${BASE}/v3/markets/chart/1d/*`, ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockMarketChartApiResponse());
        }),
      );

      await fetchChart({ id: "a/b c", counterCurrency: "eur" });

      expect(requestUrl).toBe(`${BASE}/v3/markets/chart/1d/a%2Fb%20c?to=eur`);
    });

    it("surfaces a schema failure as a CUSTOM_ERROR", async () => {
      server.use(http.get(CHART_URL("1d"), () => HttpResponse.json({ values: [[1, "2"]] })));

      const result = await fetchChart({});

      expect(result.error).toMatchObject({ status: "CUSTOM_ERROR" });
      expect(result.data).toBeUndefined();
    });

    it("does not retry a transport failure", async () => {
      let calls = 0;
      server.use(
        http.get(CHART_URL("1d"), () => {
          calls += 1;
          return new HttpResponse(null, { status: 500 });
        }),
      );

      const result = await fetchChart({});

      expect(result.error).toMatchObject({ status: 500 });
      expect(calls).toBe(1);
    });
  });

  describe("getSupportedChartCounterCurrencies", () => {
    it("lowercases the supported counter currencies", async () => {
      server.use(http.get(SUPPORTED_URL, () => HttpResponse.json(["EUR", "bitcoin", "USD"])));

      const result = await fetchSupported();

      expect(result.data).toEqual(["eur", "bitcoin", "usd"]);
    });

    it("surfaces a schema failure as a CUSTOM_ERROR", async () => {
      server.use(http.get(SUPPORTED_URL, () => HttpResponse.json(["EUR", ""])));

      const result = await fetchSupported();

      expect(result.error).toMatchObject({ status: "CUSTOM_ERROR" });
    });

    it("does not retry a transport failure", async () => {
      let calls = 0;
      server.use(
        http.get(SUPPORTED_URL, () => {
          calls += 1;
          return new HttpResponse(null, { status: 500 });
        }),
      );

      const result = await fetchSupported();

      expect(result.error).toMatchObject({ status: 500 });
      expect(calls).toBe(1);
    });
  });
});
