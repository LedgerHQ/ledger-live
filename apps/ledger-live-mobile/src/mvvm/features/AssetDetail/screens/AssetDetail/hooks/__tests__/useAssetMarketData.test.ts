import { renderHook, waitFor } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import { mockBtcCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { State } from "~/reducers/types";
import { useAssetMarketData } from "../useAssetMarketData";

const COUNTERVALUES_API = "https://countervalues.live.ledger.com";

type MarketQueryParams = {
  ids: string[];
  ledgerIds: string[];
};

function trackMarketQueryParams() {
  const captured: MarketQueryParams = { ids: [], ledgerIds: [] };
  server.use(
    http.get(`${COUNTERVALUES_API}/v3/markets`, ({ request }) => {
      const url = new URL(request.url);
      const ids = url.searchParams.get("ids");
      const ledgerIds = url.searchParams.get("ledgerIds");
      if (ids) captured.ids.push(ids);
      if (ledgerIds) captured.ledgerIds.push(ledgerIds);
      return HttpResponse.json([]);
    }),
  );
  return captured;
}

const withCounterValue =
  (ticker: string) =>
  (state: State): State => ({
    ...state,
    settings: { ...state.settings, counterValue: ticker },
  });

describe("useAssetMarketData", () => {
  describe("data forwarding", () => {
    it("returns marketCurrency from the market API", async () => {
      const { result } = renderHook(() =>
        useAssetMarketData({
          marketApiId: mockBtcCryptoCurrency.id,
          knownLedgerIds: [mockBtcCryptoCurrency.id],
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.marketCurrency).toBeDefined();
      });

      expect(result.current.marketCurrency?.price).toBeDefined();
      expect(result.current.isError).toBe(false);
    });

    it("defaults counterCurrency to the USD settings value", () => {
      const { result } = renderHook(() =>
        useAssetMarketData({
          marketApiId: mockBtcCryptoCurrency.id,
          knownLedgerIds: [mockBtcCryptoCurrency.id],
        }),
      );

      expect(result.current.counterCurrency).toBe("usd");
    });
  });

  describe("settings counter-value reactivity", () => {
    it("derives counterCurrency from the user's settings counter-value (not market screen state)", () => {
      const { result } = renderHook(
        () =>
          useAssetMarketData({
            marketApiId: mockBtcCryptoCurrency.id,
            knownLedgerIds: [mockBtcCryptoCurrency.id],
          }),
        { overrideInitialState: withCounterValue("EUR") },
      );

      expect(result.current.counterCurrency).toBe("eur");
    });

    it("forwards the settings counter-value as the `to` query param to /v3/markets", async () => {
      const requestedToValues: string[] = [];
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, ({ request }) => {
          const to = new URL(request.url).searchParams.get("to");
          if (to) requestedToValues.push(to);
          return HttpResponse.json([]);
        }),
      );

      renderHook(
        () =>
          useAssetMarketData({
            marketApiId: mockBtcCryptoCurrency.id,
            knownLedgerIds: [mockBtcCryptoCurrency.id],
          }),
        { overrideInitialState: withCounterValue("GBP") },
      );

      await waitFor(() => {
        expect(requestedToValues).toContain("gbp");
      });
    });
  });

  describe("loading state", () => {
    it("starts with isLoading true before data resolves", () => {
      const { result } = renderHook(() =>
        useAssetMarketData({
          marketApiId: mockBtcCryptoCurrency.id,
          knownLedgerIds: [mockBtcCryptoCurrency.id],
        }),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.marketCurrency).toBeUndefined();
    });
  });

  describe("error state", () => {
    it("returns isError true when the market API fails", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () => HttpResponse.json(null, { status: 500 })),
      );

      const { result } = renderHook(() =>
        useAssetMarketData({
          marketApiId: mockBtcCryptoCurrency.id,
          knownLedgerIds: [mockBtcCryptoCurrency.id],
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe("skip query", () => {
    it("does not fetch when no marketApiId is provided", () => {
      const { result } = renderHook(() => useAssetMarketData({}));

      expect(result.current.marketCurrency).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("market query strategy", () => {
    it("uses the legacy ids filter for coingecko ids", async () => {
      const captured = trackMarketQueryParams();

      renderHook(() =>
        useAssetMarketData({
          marketApiId: mockBtcCryptoCurrency.id,
          knownLedgerIds: [mockBtcCryptoCurrency.id],
        }),
      );

      await waitFor(() => {
        expect(captured.ids).toContain(mockBtcCryptoCurrency.id);
      });
      expect(captured.ledgerIds).toHaveLength(0);
    });

    it("uses the legacy ids filter for DADA urns", async () => {
      const captured = trackMarketQueryParams();

      const { result } = renderHook(() =>
        useAssetMarketData({
          marketApiId: "urn:crypto:meta-currency:shiba_inu",
          knownLedgerIds: ["ethereum/erc20/shiba_inu"],
          knownMarketId: "urn:crypto:meta-currency:shiba_inu",
        }),
      );

      await waitFor(() => {
        expect(captured.ids).toContain("shiba-inu");
      });
      expect(captured.ledgerIds).toHaveLength(0);
      expect(result.current.marketId).toBe("shiba-inu");
    });

    it("requests /v3/markets with ledgerIds when the market api id is a ledger id", async () => {
      const requestedLedgerIds: string[] = [];
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, ({ request }) => {
          const ledgerIds = new URL(request.url).searchParams.get("ledgerIds");
          if (ledgerIds) requestedLedgerIds.push(ledgerIds);
          return HttpResponse.json([
            {
              id: "shiba-inu",
              name: "Shiba Inu",
              ticker: "SHIB",
              ledgerIds: ["ethereum/erc20/shiba_inu"],
              price: 0.00001,
              marketCap: 1,
              marketCapRank: 1,
              totalVolume: 1,
              high24h: 1,
              low24h: 1,
              priceChange24h: 0,
              priceChangePercentage24h: 0,
              priceChangePercentage: {
                "1h": 0,
                "24h": 0,
                "7d": 0,
                "30d": 0,
                "6m": 0,
                "1y": 0,
              },
              image: "",
            },
          ]);
        }),
      );

      const { result } = renderHook(() =>
        useAssetMarketData({
          marketApiId: "ethereum/erc20/shiba_inu",
          knownLedgerIds: ["ethereum/erc20/shiba_inu"],
        }),
      );

      await waitFor(() => {
        expect(requestedLedgerIds).toContain("ethereum/erc20/shiba_inu");
        expect(result.current.marketId).toBe("shiba-inu");
      });
    });

    it("returns [] when no known ledger ids are provided", () => {
      const { result } = renderHook(() => useAssetMarketData({}));

      expect(result.current.ledgerIds).toEqual([]);
    });

    it("falls back to knownLedgerIds while market data has not resolved yet", () => {
      const { result } = renderHook(() =>
        useAssetMarketData({
          marketApiId: mockBtcCryptoCurrency.id,
          knownLedgerIds: [mockBtcCryptoCurrency.id],
        }),
      );

      expect(result.current.marketCurrency).toBeUndefined();
      expect(result.current.ledgerIds).toEqual([mockBtcCryptoCurrency.id]);
    });
  });
});
