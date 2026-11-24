import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import { marketIndexGlobalApi, useGetGlobalMarketDataQuery } from "./api";

const URL = "https://cvs.test/v3/markets/global";

const makeStore = () =>
  configureStore({
    reducer: { [countervaluesApi.reducerPath]: countervaluesApi.reducer },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: cvsApiExtra({ getCountervaluesServiceUrl: () => "https://cvs.test" }),
        },
      }).concat(countervaluesApi.middleware),
  });

describe("marketIndexGlobalApi configuration", () => {
  it("is the Countervalues service api, mutated in place by injectEndpoints", () => {
    expect(marketIndexGlobalApi).toBe(countervaluesApi);
  });

  it("exposes the endpoint and its hook", () => {
    expect(marketIndexGlobalApi.endpoints.getGlobalMarketData).toBeDefined();
    expect(useGetGlobalMarketDataQuery).toBeDefined();
  });
});

const fetchData = () =>
  makeStore().dispatch(
    marketIndexGlobalApi.endpoints.getGlobalMarketData.initiate({ counterCurrency: "usd" }),
  );

describe("getGlobalMarketData", () => {
  const server = setupServer();
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("sends the counter currency and converts the ratio to a percentage", async () => {
    let requestUrl = "";
    server.use(
      http.get(URL, ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json({ marketCap: 3e12, percentageChanges: { "1d": -0.0171 } });
      }),
    );

    const result = await fetchData();

    expect(requestUrl).toBe(`${URL}?to=usd`);
    expect(result.data?.marketCap).toBe(3e12);
    expect(result.data?.changePercentage24h).toBeCloseTo(-1.71);
  });

  it("surfaces a schema failure as a CUSTOM_ERROR", async () => {
    server.use(http.get(URL, () => HttpResponse.json({ percentageChanges: { "1d": 0.01 } })));

    const result = await fetchData();

    expect(result.error).toMatchObject({ status: "CUSTOM_ERROR" });
  });

  it("does not retry a transport failure", async () => {
    let calls = 0;
    server.use(
      http.get(URL, () => {
        calls += 1;
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const result = await fetchData();

    expect(result.error).toMatchObject({ status: 500 });
    expect(calls).toBe(1);
  });
});
