import { renderHook } from "@tests/test-renderer";
import { usePricePerformanceViewModel, getRelativeTime } from "../usePricePerformanceViewModel";
import { useAssetMarketData } from "../../../hooks/useAssetMarketData";
import { mockBtcCryptoCurrency } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { marketCurrencyData } from "../../../__fixtures__/marketCurrencyData";

jest.mock("../../../hooks/useAssetMarketData");

const mockUseAssetMarketData = jest.mocked(useAssetMarketData);

function mockMarketData(overrides?: Partial<ReturnType<typeof useAssetMarketData>>) {
  mockUseAssetMarketData.mockReturnValue({
    marketCurrency: marketCurrencyData as any,
    marketId: "bitcoin",
    counterCurrency: "usd",
    ledgerIds: ["bitcoin"],
    isLoading: false,
    isError: false,
    ...overrides,
  });
}

describe("usePricePerformanceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMarketData();
  });

  describe("records", () => {
    it("returns ATH and ATL records with correct labels", () => {
      const { result } = renderHook(() =>
        usePricePerformanceViewModel({ currency: mockBtcCryptoCurrency }),
      );

      expect(result.current.records).toHaveLength(2);
      expect(result.current.records[0].label).toMatch(/all.time high/i);
      expect(result.current.records[1].label).toMatch(/all.time low/i);
    });

    it("computes negative ATH change and positive ATL change", () => {
      const { result } = renderHook(() =>
        usePricePerformanceViewModel({ currency: mockBtcCryptoCurrency }),
      );

      expect(result.current.records[0].changePercentage).toMatch(/^-/);
      expect(result.current.records[1].changePercentage).toMatch(/^\+/);
    });

    it("returns an empty array when no market data", () => {
      mockMarketData({ marketCurrency: undefined });

      const { result } = renderHook(() =>
        usePricePerformanceViewModel({ currency: mockBtcCryptoCurrency }),
      );

      expect(result.current.records).toEqual([]);
    });
  });

  describe("loading state", () => {
    it("reflects isFetching from the query", () => {
      mockMarketData({ marketCurrency: undefined, isLoading: true });

      const { result } = renderHook(() =>
        usePricePerformanceViewModel({ currency: mockBtcCryptoCurrency }),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.hasData).toBe(false);
    });
  });

  describe("error state", () => {
    it("reflects isError from the query", () => {
      mockMarketData({ marketCurrency: undefined, isError: true });

      const { result } = renderHook(() =>
        usePricePerformanceViewModel({ currency: mockBtcCryptoCurrency }),
      );

      expect(result.current.isError).toBe(true);
    });
  });

  describe("skip query", () => {
    it("passes resolved ids through to useAssetMarketData when no overrides are provided", () => {
      renderHook(() => usePricePerformanceViewModel({ currency: undefined }));

      expect(mockUseAssetMarketData).toHaveBeenCalledWith(
        expect.objectContaining({
          marketApiId: undefined,
          knownLedgerIds: undefined,
        }),
      );
    });
  });
});

describe("getRelativeTime", () => {
  const t = (key: string, opts?: Record<string, unknown>) =>
    opts?.count != null ? `${key}:${opts.count}` : key;
  const now = new Date("2026-05-05T12:00:00");

  it.each([
    { date: "2021-05-05", expected: "assetDetail.pricePerformance.yearsAgo:5" },
    { date: "2026-02-05", expected: /monthsAgo:/ },
    { date: "2026-05-02", expected: /daysAgo:/ },
    { date: "2026-05-05T12:00:00", expected: "assetDetail.pricePerformance.justNow" },
  ])("returns correct label for date=$date", ({ date, expected }) => {
    const result = getRelativeTime(new Date(date), now, t);

    if (expected instanceof RegExp) {
      expect(result).toMatch(expected);
    } else {
      expect(result).toBe(expected);
    }
  });
});
