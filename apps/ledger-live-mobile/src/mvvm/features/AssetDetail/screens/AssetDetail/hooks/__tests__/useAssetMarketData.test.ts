import { renderHook, waitFor } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import { mockBtcCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { State } from "~/reducers/types";
import { useAssetMarketData } from "../useAssetMarketData";

const COUNTERVALUES_API = "https://countervalues.live.ledger.com";

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

  describe("ledgerIds", () => {
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
