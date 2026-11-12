/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useAssetChartDataInCounterValue } from "../useAssetChartDataInCounterValue";
import { useAssetChartData } from "../useAssetChartData";
import { useUsdToFiatRate } from "@features/platform-market-countervalues";
import { useGetSupportedChartCounterCurrenciesQuery } from "../../state-manager/api";
import type { MarketCoinDataChart } from "../../utils/types";

jest.mock("../useAssetChartData", () => ({ useAssetChartData: jest.fn() }));
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useUsdToFiatRate: jest.fn(),
}));
jest.mock("../../state-manager/api", () => ({
  useGetSupportedChartCounterCurrenciesQuery: jest.fn(),
}));

const mockUseAssetChartData = jest.mocked(useAssetChartData);
const mockUseUsdToFiatRate = jest.mocked(useUsdToFiatRate);
const mockUseGetSupportedChartCounterCurrenciesQuery = jest.mocked(
  useGetSupportedChartCounterCurrenciesQuery,
);

// Chart allowlist: fiat tickers and coin ids. Crypto tickers such as btc are absent.
const SUPPORTED = ["usd", "eur", "vnd", "bitcoin", "ethereum", "solana"];

const CHART: MarketCoinDataChart = {
  "1d": [
    [1, 100],
    [2, 110],
  ],
};

const mockChart = (over: Partial<ReturnType<typeof useAssetChartData>> = {}) =>
  mockUseAssetChartData.mockReturnValue({
    data: CHART,
    isLoading: false,
    isError: false,
    ...over,
  } as unknown as ReturnType<typeof useAssetChartData>);

// Use rest args (not a default param) so callers can model the still-loading
// state with an explicit `mockSupported(undefined)` — a default would override it.
const mockSupported = (...args: [] | [string[] | undefined]) =>
  mockUseGetSupportedChartCounterCurrenciesQuery.mockReturnValue({
    data: args.length === 0 ? SUPPORTED : args[0],
    isError: false,
  } as unknown as ReturnType<typeof useGetSupportedChartCounterCurrenciesQuery>);

describe("useAssetChartDataInCounterValue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChart();
    mockSupported();
    mockUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 1 });
  });

  describe("natively supported fiat countervalue", () => {
    it("requests the chart with the fiat ticker and returns the data unchanged", () => {
      const { result } = renderHook(() =>
        useAssetChartDataInCounterValue({
          id: "bitcoin",
          counterCurrency: "eur",
          range: "1d",
          isCryptoCountervalue: false,
        }),
      );

      expect(mockUseAssetChartData).toHaveBeenCalledWith(
        { id: "bitcoin", counterCurrency: "eur", range: "1d" },
        { skip: false },
      );
      expect(result.current.data).toBe(CHART);
      expect(result.current.isError).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it("does not fire a USD rate request (passes 'usd' which short-circuits)", () => {
      renderHook(() =>
        useAssetChartDataInCounterValue({
          id: "bitcoin",
          counterCurrency: "vnd",
          range: "1d",
          isCryptoCountervalue: false,
        }),
      );

      expect(mockUseAssetChartData).toHaveBeenCalledWith(
        { id: "bitcoin", counterCurrency: "vnd", range: "1d" },
        { skip: false },
      );
      expect(mockUseUsdToFiatRate).toHaveBeenCalledWith("usd", { skip: false });
    });
  });

  describe("countervalue requiring a USD fallback", () => {
    it("rescales by the USD->fiat rate for an unsupported fiat (COP)", () => {
      mockUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 0.5 });

      const { result } = renderHook(() =>
        useAssetChartDataInCounterValue({
          id: "bitcoin",
          counterCurrency: "cop",
          range: "1d",
          isCryptoCountervalue: false,
        }),
      );

      expect(mockUseAssetChartData).toHaveBeenCalledWith(
        { id: "bitcoin", counterCurrency: "usd", range: "1d" },
        { skip: false },
      );
      expect(mockUseUsdToFiatRate).toHaveBeenCalledWith("cop", { skip: false });
      expect(result.current.data).toEqual({
        "1d": [
          [1, 50],
          [2, 55],
        ],
      });
    });

    it("rescales by the USD->crypto rate for a crypto countervalue (BTC)", () => {
      mockUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 0.5 });

      const { result } = renderHook(() =>
        useAssetChartDataInCounterValue({
          id: "ethereum",
          counterCurrency: "btc",
          range: "1d",
          isCryptoCountervalue: true,
        }),
      );

      expect(mockUseAssetChartData).toHaveBeenCalledWith(
        { id: "ethereum", counterCurrency: "usd", range: "1d" },
        { skip: false },
      );
      expect(mockUseUsdToFiatRate).toHaveBeenCalledWith("btc", { skip: false });
      expect(result.current.data).toEqual({
        "1d": [
          [1, 50],
          [2, 55],
        ],
      });
    });

    it("detects crypto regardless of ticker case (e.g. uppercase 'ETH')", () => {
      mockUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 0.5 });

      renderHook(() =>
        useAssetChartDataInCounterValue({
          id: "bitcoin",
          counterCurrency: "ETH",
          range: "1d",
          isCryptoCountervalue: true,
        }),
      );

      expect(mockUseAssetChartData).toHaveBeenCalledWith(
        { id: "bitcoin", counterCurrency: "usd", range: "1d" },
        { skip: false },
      );
      expect(mockUseUsdToFiatRate).toHaveBeenCalledWith("eth", { skip: false });
    });

    it("requests USD immediately for a crypto counter value without waiting for the allowlist", () => {
      mockSupported(undefined);

      renderHook(() =>
        useAssetChartDataInCounterValue({
          id: "ethereum",
          counterCurrency: "btc",
          range: "1d",
          isCryptoCountervalue: true,
        }),
      );

      expect(mockUseAssetChartData).toHaveBeenCalledWith(
        { id: "ethereum", counterCurrency: "usd", range: "1d" },
        { skip: false },
      );
    });

    it("skips an unsupported fiat request until the supported list resolves", () => {
      mockSupported(undefined);

      const { result } = renderHook(() =>
        useAssetChartDataInCounterValue({
          id: "bitcoin",
          counterCurrency: "cop",
          range: "1d",
          isCryptoCountervalue: false,
        }),
      );

      expect(mockUseAssetChartData).toHaveBeenCalledWith(
        { id: "bitcoin", counterCurrency: "cop", range: "1d" },
        { skip: true },
      );
      expect(mockUseUsdToFiatRate).toHaveBeenCalledWith("usd", { skip: true });
      expect(result.current.data).toBeUndefined();
      expect(result.current.currentData).toBeUndefined();
      expect(result.current.isLoading).toBe(true);
    });

    it("forwards a polling interval to the chart request", () => {
      renderHook(() =>
        useAssetChartDataInCounterValue(
          { id: "bitcoin", counterCurrency: "usd", range: "1d", isCryptoCountervalue: false },
          { skip: false, pollingInterval: 180_000 },
        ),
      );

      expect(mockUseAssetChartData).toHaveBeenCalledWith(
        { id: "bitcoin", counterCurrency: "usd", range: "1d" },
        { skip: false, pollingInterval: 180_000 },
      );
    });

    it("skips the USD rate request when the chart request is skipped", () => {
      mockUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 0.5 });

      const { result } = renderHook(() =>
        useAssetChartDataInCounterValue(
          { id: "ethereum", counterCurrency: "btc", range: "1d", isCryptoCountervalue: true },
          { skip: true },
        ),
      );

      expect(mockUseAssetChartData).toHaveBeenCalledWith(
        { id: "ethereum", counterCurrency: "usd", range: "1d" },
        { skip: true },
      );
      expect(mockUseUsdToFiatRate).toHaveBeenCalledWith("btc", { skip: true });
      expect(result.current.data).toBeUndefined();
    });

    it("is loading and withholds data while the rate resolves", () => {
      mockUseUsdToFiatRate.mockReturnValue({ status: "loading", rate: null });

      const { result } = renderHook(() =>
        useAssetChartDataInCounterValue({
          id: "ethereum",
          counterCurrency: "btc",
          range: "1d",
          isCryptoCountervalue: true,
        }),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("is in error and withholds data when the rate request fails", () => {
      mockUseUsdToFiatRate.mockReturnValue({ status: "error", rate: null });

      const { result } = renderHook(() =>
        useAssetChartDataInCounterValue({
          id: "bitcoin",
          counterCurrency: "cop",
          range: "1d",
          isCryptoCountervalue: false,
        }),
      );

      expect(result.current.isError).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("propagates an error from the underlying chart request", () => {
      mockChart({ data: undefined, isError: true });
      mockUseUsdToFiatRate.mockReturnValue({ status: "ready", rate: 0.5 });

      const { result } = renderHook(() =>
        useAssetChartDataInCounterValue({
          id: "ethereum",
          counterCurrency: "btc",
          range: "1d",
          isCryptoCountervalue: true,
        }),
      );

      expect(result.current.isError).toBe(true);
    });
  });
});
