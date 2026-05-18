import { renderHook, waitFor } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import { useAssetMarketData } from "../useAssetMarketData";
import { mockBtcCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";

const COUNTERVALUES_API = "https://countervalues.live.ledger.com";

describe("useAssetMarketData", () => {
  describe("data forwarding", () => {
    it("returns marketCurrency from the market API", async () => {
      const { result } = renderHook(() => useAssetMarketData(mockBtcCryptoCurrency));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.marketCurrency).toBeDefined();
      });

      expect(result.current.marketCurrency?.price).toBeDefined();
      expect(result.current.isError).toBe(false);
    });

    it("returns counterCurrency from market params", () => {
      const { result } = renderHook(() => useAssetMarketData(mockBtcCryptoCurrency));

      expect(result.current.counterCurrency).toBe("USD");
    });
  });

  describe("loading state", () => {
    it("starts with isLoading true before data resolves", () => {
      const { result } = renderHook(() => useAssetMarketData(mockBtcCryptoCurrency));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.marketCurrency).toBeUndefined();
    });
  });

  describe("error state", () => {
    it("returns isError true when the market API fails", async () => {
      server.use(
        http.get(`${COUNTERVALUES_API}/v3/markets`, () => HttpResponse.json(null, { status: 500 })),
      );

      const { result } = renderHook(() => useAssetMarketData(mockBtcCryptoCurrency));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe("skip query", () => {
    it("does not fetch when currency is undefined", () => {
      const { result } = renderHook(() => useAssetMarketData(undefined));

      expect(result.current.marketCurrency).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });
  });
});
