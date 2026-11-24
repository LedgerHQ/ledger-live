import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { mockMarketItemResponse } from "@domain/api-market-currency/mock";
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import {
  marketPerformersApi,
  useGetMarketPerformersQuery,
  useGetTrendingPerformersQuery,
} from "./api";

const CVS_URL = "https://cvs.test";
const MARKETS_URL = `${CVS_URL}/v3/markets`;
const TRENDING_URL = `${CVS_URL}/v3/currencies/trending`;

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Wired the way the apps wire it: the store registers the service api, and the endpoints only
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

const performersArgs = {
  counterCurrency: "usd",
  range: "24h",
  sort: "desc" as const,
  supported: true,
};

describe("marketPerformersApi configuration", () => {
  it("is the countervalues service api, mutated in place by injectEndpoints", () => {
    expect(marketPerformersApi).toBe(countervaluesApi);
    expect(marketPerformersApi.reducerPath).toBe("countervaluesApi");
  });

  it("exposes both endpoints and their hooks", () => {
    expect(marketPerformersApi.endpoints.getMarketPerformers).toBeDefined();
    expect(marketPerformersApi.endpoints.getTrendingPerformers).toBeDefined();
    expect(useGetMarketPerformersQuery).toBeDefined();
    expect(useGetTrendingPerformersQuery).toBeDefined();
  });
});

describe("getMarketPerformers", () => {
  it("sends the window, sort, limit, top and supported filter as query params", async () => {
    const seen: URL[] = [];
    server.use(
      http.get(MARKETS_URL, ({ request }) => {
        seen.push(new URL(request.url));
        return HttpResponse.json([]);
      }),
    );

    await makeStore().dispatch(
      marketPerformersApi.endpoints.getMarketPerformers.initiate({
        ...performersArgs,
        range: "7d",
        sort: "asc",
        limit: 3,
      }),
    );

    expect(seen).toHaveLength(1);
    expect(seen[0].searchParams.get("to")).toBe("usd");
    expect(seen[0].searchParams.get("sort")).toBe("positive-price-change-1w");
    expect(seen[0].searchParams.get("limit")).toBe("3");
    expect(seen[0].searchParams.get("top")).toBe("50");
    expect(seen[0].searchParams.get("supported")).toBe("true");
  });

  it("ranks top gainers with the negative sort for a desc sort, and defaults the limit to 5", async () => {
    const seen: URL[] = [];
    server.use(
      http.get(MARKETS_URL, ({ request }) => {
        seen.push(new URL(request.url));
        return HttpResponse.json([]);
      }),
    );

    await makeStore().dispatch(
      marketPerformersApi.endpoints.getMarketPerformers.initiate(performersArgs),
    );

    expect(seen[0].searchParams.get("sort")).toBe("negative-price-change-1d");
    expect(seen[0].searchParams.get("limit")).toBe("5");
  });

  it("returns the formatted performers", async () => {
    server.use(
      http.get(MARKETS_URL, () =>
        HttpResponse.json([mockMarketItemResponse({ id: "bitcoin", ticker: "BTC" })]),
      ),
    );

    const result = await makeStore().dispatch(
      marketPerformersApi.endpoints.getMarketPerformers.initiate(performersArgs),
    );

    expect(result.data).toEqual([
      expect.objectContaining({ id: "bitcoin", ticker: "BTC", price: 63_250 }),
    ]);
    expect(result.data?.[0]).not.toHaveProperty("marketCap");
  });

  it("does not retry a failed request", async () => {
    let hits = 0;
    server.use(
      http.get(MARKETS_URL, () => {
        hits += 1;
        return HttpResponse.json({}, { status: 500 });
      }),
    );

    const result = await makeStore().dispatch(
      marketPerformersApi.endpoints.getMarketPerformers.initiate(performersArgs),
    );

    expect(result.error).toBeDefined();
    expect(hits).toBe(1);
  });
});

describe("getTrendingPerformers", () => {
  it("returns only supported trending currencies, in the trending order", async () => {
    const seen: URL[] = [];
    server.use(
      http.get(TRENDING_URL, () =>
        HttpResponse.json([
          { id: "ethereum", supported: true },
          { id: "unknown-coin", supported: false },
          { id: "bitcoin", supported: true },
        ]),
      ),
      http.get(MARKETS_URL, ({ request }) => {
        seen.push(new URL(request.url));
        return HttpResponse.json([
          mockMarketItemResponse({ id: "bitcoin", name: "Bitcoin" }),
          mockMarketItemResponse({ id: "ethereum", name: "Ethereum" }),
        ]);
      }),
    );

    const result = await makeStore().dispatch(
      marketPerformersApi.endpoints.getTrendingPerformers.initiate({ counterCurrency: "usd" }),
    );

    expect(seen).toHaveLength(1);
    expect(seen[0].searchParams.get("ids")).toBe("ethereum,bitcoin");
    expect(seen[0].searchParams.get("pageSize")).toBe("50");
    expect(result.data?.map(performer => performer.id)).toEqual(["ethereum", "bitcoin"]);
  });

  it("returns an empty list without fetching markets when no trending currency is supported", async () => {
    let marketHits = 0;
    server.use(
      http.get(TRENDING_URL, () => HttpResponse.json([{ id: "unknown-coin", supported: false }])),
      http.get(MARKETS_URL, () => {
        marketHits += 1;
        return HttpResponse.json([]);
      }),
    );

    const result = await makeStore().dispatch(
      marketPerformersApi.endpoints.getTrendingPerformers.initiate({ counterCurrency: "usd" }),
    );

    expect(result.data).toEqual([]);
    expect(marketHits).toBe(0);
  });

  it("returns a custom error when the trending response is invalid", async () => {
    server.use(http.get(TRENDING_URL, () => HttpResponse.json({ id: "bitcoin" })));

    const result = await makeStore().dispatch(
      marketPerformersApi.endpoints.getTrendingPerformers.initiate({ counterCurrency: "usd" }),
    );

    expect(result.data).toBeUndefined();
    expect(result.error).toMatchObject({ status: "CUSTOM_ERROR" });
  });
});
