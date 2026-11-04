/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useResolveMarketCounterCurrency } from "../useResolveMarketCounterCurrency";
import { useGetSupportedChartCounterCurrenciesQuery } from "../../state-manager/api";

jest.mock("../../state-manager/api", () => ({
  useGetSupportedChartCounterCurrenciesQuery: jest.fn(),
}));

const mockUseGetSupportedChartCounterCurrenciesQuery = jest.mocked(
  useGetSupportedChartCounterCurrenciesQuery,
);

// CVS /v3/supported/markets/chart/to: fiat tickers and coin ids, not crypto tickers.
const SUPPORTED = ["usd", "eur", "gbp", "vnd", "bitcoin", "ethereum", "solana"];

const mockSupported = (...args: [] | [string[] | undefined]) =>
  mockUseGetSupportedChartCounterCurrenciesQuery.mockReturnValue({
    data: args.length === 0 ? SUPPORTED : args[0],
    isError: false,
  } as unknown as ReturnType<typeof useGetSupportedChartCounterCurrenciesQuery>);

const mockSupportedError = () =>
  mockUseGetSupportedChartCounterCurrenciesQuery.mockReturnValue({
    data: undefined,
    isError: true,
  } as unknown as ReturnType<typeof useGetSupportedChartCounterCurrenciesQuery>);

describe("useResolveMarketCounterCurrency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupported();
  });

  describe("USD counter currency", () => {
    it("passes through usd with no fallback and no loading", () => {
      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({ counterCurrency: "usd", isCryptoCountervalue: false }),
      );

      expect(result.current.requestCounterCurrency).toBe("usd");
      expect(result.current.displayCounterCurrency).toBe("usd");
      expect(result.current.needsUsdFallback).toBe(false);
      expect(result.current.isResolutionLoading).toBe(false);
    });

    it("is case-insensitive for USD", () => {
      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({ counterCurrency: "USD", isCryptoCountervalue: false }),
      );

      expect(result.current.requestCounterCurrency).toBe("usd");
      expect(result.current.needsUsdFallback).toBe(false);
      expect(result.current.isResolutionLoading).toBe(false);
    });
  });

  describe("supported fiat counter currency", () => {
    it("passes through a supported fiat with no fallback", () => {
      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({ counterCurrency: "eur", isCryptoCountervalue: false }),
      );

      expect(result.current.requestCounterCurrency).toBe("eur");
      expect(result.current.displayCounterCurrency).toBe("eur");
      expect(result.current.needsUsdFallback).toBe(false);
      expect(result.current.isResolutionLoading).toBe(false);
    });

    it("passes through a coin id present in the chart allowlist", () => {
      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({
          counterCurrency: "bitcoin",
          isCryptoCountervalue: false,
        }),
      );

      expect(result.current.requestCounterCurrency).toBe("bitcoin");
      expect(result.current.needsUsdFallback).toBe(false);
    });
  });

  describe("unsupported fiat counter currency", () => {
    it("falls back to USD when the fiat is not in the chart allowlist", () => {
      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({ counterCurrency: "cop", isCryptoCountervalue: false }),
      );

      expect(result.current.needsUsdFallback).toBe(true);
      expect(result.current.requestCounterCurrency).toBe("usd");
      expect(result.current.displayCounterCurrency).toBe("cop");
    });

    it("is loading while the chart allowlist has not yet resolved", () => {
      mockSupported(undefined);

      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({ counterCurrency: "cop", isCryptoCountervalue: false }),
      );

      expect(result.current.isResolutionLoading).toBe(true);
      expect(result.current.needsUsdFallback).toBe(false);
      expect(result.current.requestCounterCurrency).toBe("cop");
    });

    it("stops blocking when the chart allowlist errors out", () => {
      mockSupportedError();

      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({ counterCurrency: "cop", isCryptoCountervalue: false }),
      );

      expect(result.current.isResolutionLoading).toBe(false);
      expect(result.current.needsUsdFallback).toBe(false);
      expect(result.current.requestCounterCurrency).toBe("cop");
    });
  });

  describe("crypto counter currency with fallbackForCryptoCountervalues", () => {
    it("falls back to USD even when the ticker is in the chart allowlist", () => {
      mockSupported(["usd", "eur", "btc"]);

      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({
          counterCurrency: "btc",
          fallbackForCryptoCountervalues: true,
          isCryptoCountervalue: true,
        }),
      );

      expect(result.current.needsUsdFallback).toBe(true);
      expect(result.current.requestCounterCurrency).toBe("usd");
      expect(result.current.displayCounterCurrency).toBe("btc");
      expect(result.current.isResolutionLoading).toBe(false);
    });

    it("does not wait for the allowlist before falling back a crypto counter value", () => {
      mockSupported(undefined);

      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({
          counterCurrency: "btc",
          fallbackForCryptoCountervalues: true,
          isCryptoCountervalue: true,
        }),
      );

      expect(result.current.isResolutionLoading).toBe(false);
      expect(result.current.needsUsdFallback).toBe(true);
      expect(result.current.requestCounterCurrency).toBe("usd");
    });

    it("passes a crypto ticker through when the fallback flag is off and the ticker is listed", () => {
      mockSupported(["usd", "btc"]);

      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({
          counterCurrency: "btc",
          isCryptoCountervalue: true,
        }),
      );

      expect(result.current.needsUsdFallback).toBe(false);
      expect(result.current.requestCounterCurrency).toBe("btc");
    });
  });

  describe("crypto ticker counter currency", () => {
    it("falls back to USD when the ticker is absent from the chart allowlist", () => {
      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({ counterCurrency: "btc", isCryptoCountervalue: false }),
      );

      expect(result.current.needsUsdFallback).toBe(true);
      expect(result.current.requestCounterCurrency).toBe("usd");
      expect(result.current.displayCounterCurrency).toBe("btc");
    });

    it("falls back to USD for ETH regardless of case", () => {
      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({ counterCurrency: "ETH", isCryptoCountervalue: false }),
      );

      expect(result.current.needsUsdFallback).toBe(true);
      expect(result.current.requestCounterCurrency).toBe("usd");
    });

    it("waits for the chart allowlist before falling back a crypto ticker", () => {
      mockSupported(undefined);

      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({ counterCurrency: "btc", isCryptoCountervalue: false }),
      );

      expect(result.current.isResolutionLoading).toBe(true);
      expect(result.current.needsUsdFallback).toBe(false);
      expect(result.current.requestCounterCurrency).toBe("btc");
    });
  });

  describe("undefined counter currency", () => {
    it("returns undefined for request and display currencies with no loading", () => {
      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({
          counterCurrency: undefined,
          isCryptoCountervalue: false,
        }),
      );

      expect(result.current.requestCounterCurrency).toBeUndefined();
      expect(result.current.displayCounterCurrency).toBeUndefined();
      expect(result.current.needsUsdFallback).toBe(false);
      expect(result.current.isResolutionLoading).toBe(false);
    });
  });
});
