/**
 * @jest-environment jsdom
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createTestStore } from "@tests/test-helpers/testUtils";
import { marketApi } from "./marketApi";
import { createMockMarketItemResponse } from "../utils/fixtures";

let store: ReturnType<typeof createTestStore>;
const basePath = "/countervalue";
const server = setupServer();

beforeAll(() => {
  server.listen();
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  store = createTestStore([marketApi]);
});

afterEach(() => {
  store.dispatch(marketApi.util.resetApiState());
  server.resetHandlers();
});

describe("marketApi", () => {
  it("has the correct reducerPath", () => {
    expect(marketApi.reducerPath).toBe("marketApi");
  });

  describe("[endpoint] getAssetChartData", () => {
    const { getAssetChartData } = marketApi.endpoints;

    const validResponse = {
      values: [
        [1779861598000, 1781.81],
        [1779861897000, 1782.65],
      ],
    };

    it("builds the URL with the mapped range segment and forwards the counter currency", async () => {
      const seenUrls: string[] = [];
      server.use(
        http.get("*/v3/markets/chart/*", ({ request }) => {
          seenUrls.push(request.url);
          return HttpResponse.json(validResponse);
        }),
      );

      await store.dispatch(
        getAssetChartData.initiate({ id: "ethereum", counterCurrency: "EUR", range: "1h" }),
      );

      expect(seenUrls).toHaveLength(1);
      const url = new URL(seenUrls[0]);
      expect(url.pathname).toBe(`${basePath}/v3/markets/chart/1h/ethereum`);
      expect(url.searchParams.get("to")).toBe("EUR");
    });

    it.each([
      ["24h", "1d"],
      ["7d", "1w"],
      ["30d", "1m"],
      ["1y", "1y"],
      ["all", "all"],
      ["day", "1d"],
      ["week", "1w"],
      ["month", "1m"],
      ["year", "1y"],
      ["1d", "1d"],
      ["1w", "1w"],
      ["1m", "1m"],
      ["6m", "6m"],
      ["5y", "5y"],
    ])("maps UI range '%s' to URL segment '%s'", async (range, segment) => {
      const seenUrls: string[] = [];
      server.use(
        http.get("*/v3/markets/chart/*", ({ request }) => {
          seenUrls.push(request.url);
          return HttpResponse.json(validResponse);
        }),
      );

      await store.dispatch(
        getAssetChartData.initiate({ id: "bitcoin", counterCurrency: "usd", range }),
      );

      expect(new URL(seenUrls[0]).pathname).toBe(`${basePath}/v3/markets/chart/${segment}/bitcoin`);
    });

    it("percent-encodes the asset id so reserved characters do not break the URL path", async () => {
      const seenUrls: string[] = [];
      server.use(
        http.get("*/v3/markets/chart/*", ({ request }) => {
          seenUrls.push(request.url);
          return HttpResponse.json(validResponse);
        }),
      );

      const ledgerId = "arbitrum/erc20/rain_0x25118290e6a5f4139381d072181157035864099d";
      await store.dispatch(
        getAssetChartData.initiate({ id: ledgerId, counterCurrency: "usd", range: "1w" }),
      );

      expect(seenUrls).toHaveLength(1);
      const url = new URL(seenUrls[0]);
      expect(url.pathname).toBe(`${basePath}/v3/markets/chart/1w/${encodeURIComponent(ledgerId)}`);
      expect(decodeURIComponent(url.pathname.split("/").pop() ?? "")).toBe(ledgerId);
    });

    it("defaults to '1d' segment when range is omitted", async () => {
      const seenUrls: string[] = [];
      server.use(
        http.get("*/v3/markets/chart/*", ({ request }) => {
          seenUrls.push(request.url);
          return HttpResponse.json(validResponse);
        }),
      );

      await store.dispatch(getAssetChartData.initiate({ id: "bitcoin", counterCurrency: "usd" }));

      expect(new URL(seenUrls[0]).pathname).toBe(`${basePath}/v3/markets/chart/1d/bitcoin`);
    });

    it("transforms `{ values: [[ts, value]] }` into `{ [range]: [[ts, value]] }`", async () => {
      server.use(http.get("*/v3/markets/chart/*", () => HttpResponse.json(validResponse)));

      const result = await store.dispatch(
        getAssetChartData.initiate({ id: "ethereum", counterCurrency: "eur", range: "7d" }),
      );

      expect(result.isSuccess).toBe(true);
      expect(result.data).toEqual({
        "7d": [
          [1779861598000, 1781.81],
          [1779861897000, 1782.65],
        ],
      });
    });

    it("keys the transformed data by the original UI range (not the URL segment)", async () => {
      server.use(http.get("*/v3/markets/chart/*", () => HttpResponse.json(validResponse)));

      const result = await store.dispatch(
        getAssetChartData.initiate({ id: "ethereum", counterCurrency: "eur", range: "24h" }),
      );

      expect(result.isSuccess).toBe(true);
      expect(Object.keys(result.data ?? {})).toEqual(["24h"]);
    });

    describe("schema validation errors", () => {
      let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

      beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      });

      afterEach(() => {
        consoleErrorSpy.mockRestore();
      });

      it("returns isError when the response schema is invalid", async () => {
        server.use(
          http.get("*/v3/markets/chart/*", () =>
            HttpResponse.json({ values: [["not-a-number", 1]] }),
          ),
        );

        const result = await store.dispatch(
          getAssetChartData.initiate({ id: "ethereum", counterCurrency: "eur", range: "24h" }),
        );

        expect(result.isError).toBe(true);
        expect(result.data).toBeUndefined();
      });

      it("returns isError when the response is missing the `values` array", async () => {
        server.use(http.get("*/v3/markets/chart/*", () => HttpResponse.json({})));

        const result = await store.dispatch(
          getAssetChartData.initiate({ id: "ethereum", counterCurrency: "eur", range: "24h" }),
        );

        expect(result.isError).toBe(true);
      });
    });
  });

  describe("[endpoint] getTrendingCategories", () => {
    const { getTrendingCategories } = marketApi.endpoints;

    const category = (id: string) => ({ id, name: `${id} name` });

    it("requests /v3/categories/trending", async () => {
      const seenUrls: string[] = [];
      server.use(
        http.get("*/v3/categories/trending", ({ request }) => {
          seenUrls.push(request.url);
          return HttpResponse.json([category("infrastructure")]);
        }),
      );

      await store.dispatch(getTrendingCategories.initiate());

      expect(seenUrls).toHaveLength(1);
      expect(new URL(seenUrls[0]).pathname).toBe(`${basePath}/v3/categories/trending`);
    });

    it("returns the validated trending categories", async () => {
      const categories = [category("infrastructure"), category("yield-farming")];
      server.use(http.get("*/v3/categories/trending", () => HttpResponse.json(categories)));

      const result = await store.dispatch(getTrendingCategories.initiate());

      expect(result.isSuccess).toBe(true);
      expect(result.data).toEqual(categories);
    });

    it("keeps only the first 5 trending categories", async () => {
      const categories = Array.from({ length: 8 }, (_, i) => category(`category-${i}`));
      server.use(http.get("*/v3/categories/trending", () => HttpResponse.json(categories)));

      const result = await store.dispatch(getTrendingCategories.initiate());

      expect(result.isSuccess).toBe(true);
      expect(result.data).toHaveLength(5);
      expect(result.data).toEqual(categories.slice(0, 5));
    });

    it("returns isError when the response schema is invalid", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      server.use(http.get("*/v3/categories/trending", () => HttpResponse.json([{ id: "x" }])));

      const result = await store.dispatch(getTrendingCategories.initiate());

      expect(result.isError).toBe(true);
      expect(result.data).toBeUndefined();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("[endpoint] getMarketsByLedgerIds", () => {
    const { getMarketsByLedgerIds } = marketApi.endpoints;

    it("requests ledger ids together with a fitting page size and keeps request order", async () => {
      const seenUrls: string[] = [];
      server.use(
        http.get("*/v3/markets", ({ request }) => {
          seenUrls.push(request.url);
          return HttpResponse.json([
            createMockMarketItemResponse({
              id: "ethereum",
              ledgerIds: ["ethereum"],
              ticker: "ETH",
            }),
            createMockMarketItemResponse({ id: "bitcoin", ledgerIds: ["bitcoin"], ticker: "BTC" }),
          ]);
        }),
      );

      const result = await store.dispatch(
        getMarketsByLedgerIds.initiate({
          ledgerIds: ["bitcoin", "missing", "ethereum"],
          counterCurrency: "usd",
        }),
      );

      expect(result.isSuccess).toBe(true);
      expect(result.data?.map(item => item.id)).toEqual(["bitcoin", "ethereum"]);

      expect(seenUrls).toHaveLength(1);
      const url = new URL(seenUrls[0]);
      expect(url.searchParams.get("to")).toBe("usd");
      expect(url.searchParams.get("ledgerIds")).toBe("bitcoin,missing,ethereum");
      expect(url.searchParams.get("pageSize")).toBe("5");
    });

    it("keeps a requested ledger id on its own market when another row lists that id", async () => {
      server.use(
        http.get("*/v3/markets", () =>
          HttpResponse.json([
            createMockMarketItemResponse({
              id: "ethereum",
              ledgerIds: ["base", "arbitrum", "ethereum", "boba", "optimism", "linea"],
              ticker: "ETH",
            }),
            createMockMarketItemResponse({
              id: "optimism",
              ledgerIds: ["optimism", "ethereum/erc20/optimism"],
              ticker: "OP",
            }),
          ]),
        ),
      );

      const result = await store.dispatch(
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
      const seenUrls: string[] = [];
      server.use(
        http.get("*/v3/markets", ({ request }) => {
          seenUrls.push(request.url);
          return HttpResponse.json([]);
        }),
      );

      await store.dispatch(
        getMarketsByLedgerIds.initiate({
          ledgerIds: Array.from({ length: count }, (_, index) => `id-${index}`),
          counterCurrency: "eur",
        }),
      );

      expect(seenUrls).toHaveLength(1);
      expect(new URL(seenUrls[0]).searchParams.get("pageSize")).toBe(pageSize);
    });

    it("requests another page only when there are more ledger ids than one page allows", async () => {
      const seenUrls: string[] = [];
      server.use(
        http.get("*/v3/markets", ({ request }) => {
          seenUrls.push(request.url);
          const ids = new URL(request.url).searchParams.get("ledgerIds")?.split(",") ?? [];
          return HttpResponse.json(
            ids.map(id => createMockMarketItemResponse({ id, ledgerIds: [id], ticker: id })),
          );
        }),
      );

      const ledgerIds = Array.from({ length: 51 }, (_, index) => `id-${index}`);
      const result = await store.dispatch(
        getMarketsByLedgerIds.initiate({ ledgerIds, counterCurrency: "eur" }),
      );

      expect(result.isSuccess).toBe(true);
      expect(result.data?.map(item => item.id)).toEqual(ledgerIds);

      expect(seenUrls).toHaveLength(2);
      const [firstPage, secondPage] = seenUrls.map(url => new URL(url));
      expect(firstPage.searchParams.get("pageSize")).toBe("50");
      expect(firstPage.searchParams.get("ledgerIds")?.split(",")).toEqual(ledgerIds.slice(0, 50));
      expect(secondPage.searchParams.get("pageSize")).toBe("1");
      expect(secondPage.searchParams.get("ledgerIds")).toBe("id-50");
    });

    it("omits a failed page and keeps the markets from the pages that succeeded", async () => {
      server.use(
        http.get("*/v3/markets", ({ request }) => {
          const ids = new URL(request.url).searchParams.get("ledgerIds")?.split(",") ?? [];
          if (ids.length === 1) return new HttpResponse(null, { status: 500 });
          return HttpResponse.json(
            ids.map(id => createMockMarketItemResponse({ id, ledgerIds: [id], ticker: id })),
          );
        }),
      );

      const ledgerIds = Array.from({ length: 51 }, (_, index) => `id-${index}`);
      const result = await store.dispatch(
        getMarketsByLedgerIds.initiate({ ledgerIds, counterCurrency: "eur" }),
      );

      expect(result.isSuccess).toBe(true);
      expect(result.data?.map(item => item.id)).toEqual(ledgerIds.slice(0, 50));
    });

    it("returns an error when every page fails", async () => {
      server.use(http.get("*/v3/markets", () => new HttpResponse(null, { status: 500 })));

      const result = await store.dispatch(
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
        http.get("*/v3/markets", ({ request }) => {
          const ids = new URL(request.url).searchParams.get("ledgerIds")?.split(",") ?? [];
          if (ids.length === 1) return HttpResponse.json({ unexpected: true });
          return HttpResponse.json(
            ids.map(id => createMockMarketItemResponse({ id, ledgerIds: [id], ticker: id })),
          );
        }),
      );

      const ledgerIds = Array.from({ length: 51 }, (_, index) => `id-${index}`);
      const result = await store.dispatch(
        getMarketsByLedgerIds.initiate({ ledgerIds, counterCurrency: "eur" }),
      );

      expect(result.isSuccess).toBe(true);
      expect(result.data?.map(item => item.id)).toEqual(ledgerIds.slice(0, 50));
    });

    it("returns an error when every page body is not a market list", async () => {
      server.use(http.get("*/v3/markets", () => HttpResponse.json({ unexpected: true })));

      const result = await store.dispatch(
        getMarketsByLedgerIds.initiate({
          ledgerIds: ["bitcoin", "ethereum"],
          counterCurrency: "usd",
        }),
      );

      expect(result.isError).toBe(true);
      expect(result.error).toEqual({
        status: "CUSTOM_ERROR",
        error: "Invalid markets response",
      });
      expect(result.data).toBeUndefined();
    });
  });

  describe("[endpoint] getTrendingPerformers", () => {
    const { getTrendingPerformers } = marketApi.endpoints;

    const trending = (id: string, supported: boolean) => ({ id, supported });

    it("hydrates only the supported trending ids and preserves the trending order", async () => {
      const seenMarketsUrls: string[] = [];
      server.use(
        http.get("*/v3/currencies/trending", () =>
          HttpResponse.json([
            trending("solana", true),
            trending("autonomi", false),
            trending("bitcoin", true),
            trending("ethereum", true),
          ]),
        ),
        // Markets is returned in a different order than the trending list to prove re-ordering.
        http.get("*/v3/markets", ({ request }) => {
          seenMarketsUrls.push(request.url);
          return HttpResponse.json([
            createMockMarketItemResponse({ id: "ethereum", ticker: "ETH" }),
            createMockMarketItemResponse({ id: "bitcoin", ticker: "BTC" }),
            createMockMarketItemResponse({ id: "solana", ticker: "SOL" }),
          ]);
        }),
      );

      const result = await store.dispatch(
        getTrendingPerformers.initiate({ counterCurrency: "usd" }),
      );

      expect(result.isSuccess).toBe(true);
      expect(result.data?.map(item => item.id)).toEqual(["solana", "bitcoin", "ethereum"]);

      expect(seenMarketsUrls).toHaveLength(1);
      const url = new URL(seenMarketsUrls[0]);
      expect(url.searchParams.get("to")).toBe("usd");
      expect(url.searchParams.get("ids")).toBe("solana,bitcoin,ethereum");
      // pageSize must be one of the discrete values the API accepts (1/5/20/50).
      expect(url.searchParams.get("pageSize")).toBe("50");
    });

    it("returns an empty list and skips the markets call when no trending id is supported", async () => {
      let marketsCalled = false;
      server.use(
        http.get("*/v3/currencies/trending", () =>
          HttpResponse.json([trending("autonomi", false), trending("meteora", false)]),
        ),
        http.get("*/v3/markets", () => {
          marketsCalled = true;
          return HttpResponse.json([]);
        }),
      );

      const result = await store.dispatch(
        getTrendingPerformers.initiate({ counterCurrency: "usd" }),
      );

      expect(result.isSuccess).toBe(true);
      expect(result.data).toEqual([]);
      expect(marketsCalled).toBe(false);
    });

    it("returns isError when the trending response schema is invalid", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      server.use(http.get("*/v3/currencies/trending", () => HttpResponse.json([{ id: "x" }])));

      const result = await store.dispatch(
        getTrendingPerformers.initiate({ counterCurrency: "usd" }),
      );

      expect(result.isError).toBe(true);
      expect(result.data).toBeUndefined();
      consoleErrorSpy.mockRestore();
    });
  });
});
