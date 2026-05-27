/**
 * @jest-environment jsdom
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createTestStore } from "@tests/test-helpers/testUtils";
import { marketApi } from "./marketApi";

let store: ReturnType<typeof createTestStore>;
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
      expect(url.pathname).toBe("/v3/markets/chart/1h/ethereum");
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

      expect(new URL(seenUrls[0]).pathname).toBe(`/v3/markets/chart/${segment}/bitcoin`);
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

      expect(new URL(seenUrls[0]).pathname).toBe("/v3/markets/chart/1d/bitcoin");
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
