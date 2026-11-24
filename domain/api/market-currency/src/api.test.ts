import { configureStore } from "@reduxjs/toolkit";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { countervaluesApi, cvsApiExtra } from "@shared/api-services";
import { Order } from "@domain/entity-market-currency";
import { marketCurrencyApi } from "./api";
import { mockMarketItemResponse } from "./marketItem.mock";

const CVS_URL = "https://cvs.test";
const MARKETS_URL = `${CVS_URL}/v3/markets`;

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

/** Answers each requested ledger id with a market of its own, in the order asked. */
const marketsForRequestedIds = (request: Request) => {
  const ids = new URL(request.url).searchParams.get("ledgerIds")?.split(",") ?? [];
  return ids.map(id => mockMarketItemResponse({ id, ledgerIds: [id], ticker: id }));
};

describe("marketCurrencyApi configuration", () => {
  it("is the countervalues service api, mutated in place by injectEndpoints", () => {
    expect(marketCurrencyApi).toBe(countervaluesApi);
    expect(marketCurrencyApi.reducerPath).toBe("countervaluesApi");
  });
});

describe("getMarketsByLedgerIds", () => {
  const { getMarketsByLedgerIds } = marketCurrencyApi.endpoints;

  it("requests ledger ids together with a fitting page size and keeps request order", async () => {
    const seenUrls: URL[] = [];
    server.use(
      http.get(MARKETS_URL, ({ request }) => {
        seenUrls.push(new URL(request.url));
        return HttpResponse.json([
          mockMarketItemResponse({ id: "ethereum", ledgerIds: ["ethereum"], ticker: "ETH" }),
          mockMarketItemResponse({ id: "bitcoin", ledgerIds: ["bitcoin"], ticker: "BTC" }),
        ]);
      }),
    );

    const result = await makeStore().dispatch(
      getMarketsByLedgerIds.initiate({
        ledgerIds: ["bitcoin", "missing", "ethereum"],
        counterCurrency: "usd",
      }),
    );

    expect(result.isSuccess).toBe(true);
    expect(result.data?.map(item => item.id)).toEqual(["bitcoin", "ethereum"]);
    expect(seenUrls).toHaveLength(1);
    expect(seenUrls[0].searchParams.get("to")).toBe("usd");
    expect(seenUrls[0].searchParams.get("ledgerIds")).toBe("bitcoin,missing,ethereum");
    expect(seenUrls[0].searchParams.get("pageSize")).toBe("5");
  });

  it("keeps a requested ledger id on its own market when another row lists that id", async () => {
    server.use(
      http.get(MARKETS_URL, () =>
        HttpResponse.json([
          mockMarketItemResponse({
            id: "ethereum",
            ledgerIds: ["base", "arbitrum", "ethereum", "boba", "optimism", "linea"],
            ticker: "ETH",
          }),
          mockMarketItemResponse({
            id: "optimism",
            ledgerIds: ["optimism", "ethereum/erc20/optimism"],
            ticker: "OP",
          }),
        ]),
      ),
    );

    const result = await makeStore().dispatch(
      getMarketsByLedgerIds.initiate({
        ledgerIds: ["optimism", "ethereum"],
        counterCurrency: "usd",
      }),
    );

    expect(result.data?.map(item => item.id)).toEqual(["optimism", "ethereum"]);
  });

  it.each([
    ["1", 1],
    ["20", 6],
    ["50", 50],
  ] as const)("requests pageSize %s for %s ledger ids", async (pageSize, count) => {
    const seenUrls: URL[] = [];
    server.use(
      http.get(MARKETS_URL, ({ request }) => {
        seenUrls.push(new URL(request.url));
        return HttpResponse.json([]);
      }),
    );

    await makeStore().dispatch(
      getMarketsByLedgerIds.initiate({
        ledgerIds: Array.from({ length: count }, (_, index) => `id-${index}`),
        counterCurrency: "eur",
      }),
    );

    expect(seenUrls).toHaveLength(1);
    expect(seenUrls[0].searchParams.get("pageSize")).toBe(pageSize);
  });

  it("requests another page only when there are more ledger ids than one page allows", async () => {
    const seenUrls: URL[] = [];
    server.use(
      http.get(MARKETS_URL, ({ request }) => {
        seenUrls.push(new URL(request.url));
        return HttpResponse.json(marketsForRequestedIds(request));
      }),
    );

    const ledgerIds = Array.from({ length: 51 }, (_, index) => `id-${index}`);
    const result = await makeStore().dispatch(
      getMarketsByLedgerIds.initiate({ ledgerIds, counterCurrency: "eur" }),
    );

    expect(result.isSuccess).toBe(true);
    expect(result.data?.map(item => item.id)).toEqual(ledgerIds);
    expect(seenUrls).toHaveLength(2);
    const [firstPage, secondPage] = seenUrls;
    expect(firstPage.searchParams.get("pageSize")).toBe("50");
    expect(firstPage.searchParams.get("ledgerIds")?.split(",")).toEqual(ledgerIds.slice(0, 50));
    expect(secondPage.searchParams.get("pageSize")).toBe("1");
    expect(secondPage.searchParams.get("ledgerIds")).toBe("id-50");
  });

  it("omits a failed page and keeps the markets from the pages that succeeded", async () => {
    server.use(
      http.get(MARKETS_URL, ({ request }) => {
        if (marketsForRequestedIds(request).length === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json(marketsForRequestedIds(request));
      }),
    );

    const ledgerIds = Array.from({ length: 51 }, (_, index) => `id-${index}`);
    const result = await makeStore().dispatch(
      getMarketsByLedgerIds.initiate({ ledgerIds, counterCurrency: "eur" }),
    );

    expect(result.isSuccess).toBe(true);
    expect(result.data?.map(item => item.id)).toEqual(ledgerIds.slice(0, 50));
  });

  it("returns an error when every page fails", async () => {
    server.use(http.get(MARKETS_URL, () => new HttpResponse(null, { status: 500 })));

    const result = await makeStore().dispatch(
      getMarketsByLedgerIds.initiate({
        ledgerIds: ["bitcoin", "ethereum"],
        counterCurrency: "usd",
      }),
    );

    expect(result.isError).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it("omits a page whose body is not a market list and keeps the pages that are", async () => {
    server.use(
      http.get(MARKETS_URL, ({ request }) => {
        if (marketsForRequestedIds(request).length === 1) {
          return HttpResponse.json({ unexpected: true });
        }
        return HttpResponse.json(marketsForRequestedIds(request));
      }),
    );

    const ledgerIds = Array.from({ length: 51 }, (_, index) => `id-${index}`);
    const result = await makeStore().dispatch(
      getMarketsByLedgerIds.initiate({ ledgerIds, counterCurrency: "eur" }),
    );

    expect(result.isSuccess).toBe(true);
    expect(result.data?.map(item => item.id)).toEqual(ledgerIds.slice(0, 50));
  });

  it("returns an error when every page body is not a market list", async () => {
    server.use(http.get(MARKETS_URL, () => HttpResponse.json({ unexpected: true })));

    const result = await makeStore().dispatch(
      getMarketsByLedgerIds.initiate({
        ledgerIds: ["bitcoin", "ethereum"],
        counterCurrency: "usd",
      }),
    );

    expect(result.isError).toBe(true);
    expect(result.error).toEqual({ status: "CUSTOM_ERROR", error: "Invalid markets response" });
    expect(result.data).toBeUndefined();
  });

  it("does not retry a failed page", async () => {
    let hits = 0;
    server.use(
      http.get(MARKETS_URL, () => {
        hits += 1;
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await makeStore().dispatch(
      getMarketsByLedgerIds.initiate({ ledgerIds: ["bitcoin"], counterCurrency: "usd" }),
    );

    expect(hits).toBe(1);
  });
});

describe("getCurrencyData", () => {
  const { getCurrencyData } = marketCurrencyApi.endpoints;

  it("looks the currency up by its id when no ledger id is given", async () => {
    const seenUrls: URL[] = [];
    server.use(
      http.get(MARKETS_URL, ({ request }) => {
        seenUrls.push(new URL(request.url));
        return HttpResponse.json([mockMarketItemResponse()]);
      }),
    );

    const result = await makeStore().dispatch(
      getCurrencyData.initiate({ id: "bitcoin", counterCurrency: "usd" }),
    );

    expect(seenUrls[0].searchParams.get("ids")).toBe("bitcoin");
    expect(seenUrls[0].searchParams.get("pageSize")).toBe("1");
    expect(seenUrls[0].searchParams.get("limit")).toBe("1");
    expect(result.data?.id).toBe("bitcoin");
    expect(result.data?.priceChangePercentage["1h"]).toBe(0.12);
  });

  it("looks the currency up by ledger id when ledger ids are given", async () => {
    const seenUrls: URL[] = [];
    server.use(
      http.get(MARKETS_URL, ({ request }) => {
        seenUrls.push(new URL(request.url));
        return HttpResponse.json([mockMarketItemResponse()]);
      }),
    );

    await makeStore().dispatch(
      getCurrencyData.initiate({ ledgerIds: ["bitcoin"], counterCurrency: "usd" }),
    );

    expect(seenUrls[0].searchParams.get("ledgerIds")).toBe("bitcoin");
    expect(seenUrls[0].searchParams.has("ids")).toBe(false);
  });

  it("returns undefined when the market list is empty", async () => {
    server.use(http.get(MARKETS_URL, () => HttpResponse.json([])));

    const result = await makeStore().dispatch(
      getCurrencyData.initiate({ id: "unknown", counterCurrency: "usd" }),
    );

    expect(result.isSuccess).toBe(true);
    expect(result.data).toBeUndefined();
  });
});

describe("getMarketList", () => {
  const { getMarketList } = marketCurrencyApi.endpoints;

  it("sends the page size, the sort and the counter currency of the query", async () => {
    const seenUrls: URL[] = [];
    server.use(
      http.get(MARKETS_URL, ({ request }) => {
        seenUrls.push(new URL(request.url));
        return HttpResponse.json([mockMarketItemResponse()]);
      }),
    );

    const result = await makeStore().dispatch(
      getMarketList.initiate({
        counterCurrency: "usd",
        pageSize: 20,
        order: Order.topGainers,
        range: "7d",
      }),
    );

    expect(seenUrls[0].searchParams.get("to")).toBe("usd");
    expect(seenUrls[0].searchParams.get("pageSize")).toBe("20");
    expect(seenUrls[0].searchParams.get("sort")).toBe("positive-price-change-1w");
    expect(result.data?.pages[0]?.[0].id).toBe("bitcoin");
  });
});
