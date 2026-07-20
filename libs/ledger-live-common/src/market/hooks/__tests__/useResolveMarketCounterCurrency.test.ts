/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useResolveMarketCounterCurrency } from "../useResolveMarketCounterCurrency";
import { useSupportedCounterCurrencies } from "../../../cg-client/hooks/useCoingeckoDataProvider";

jest.mock("../../../cg-client/hooks/useCoingeckoDataProvider", () => ({
  useSupportedCounterCurrencies: jest.fn(),
}));

const mockUseSupportedCounterCurrencies = jest.mocked(useSupportedCounterCurrencies);

// CoinGecko supported_vs_currencies includes common fiats and crypto tickers
const SUPPORTED = ["usd", "eur", "gbp", "vnd", "btc", "eth", "sats"];

const mockSupported = (...args: [] | [string[] | undefined]) =>
  mockUseSupportedCounterCurrencies.mockReturnValue({
    data: args.length === 0 ? SUPPORTED : args[0],
    isError: false,
  } as unknown as ReturnType<typeof useSupportedCounterCurrencies>);

const mockSupportedError = () =>
  mockUseSupportedCounterCurrencies.mockReturnValue({
    data: undefined,
    isError: true,
  } as unknown as ReturnType<typeof useSupportedCounterCurrencies>);

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
  });

  describe("unsupported fiat counter currency", () => {
    it("falls back to USD when the fiat is not in the supported list", () => {
      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({ counterCurrency: "cop", isCryptoCountervalue: false }),
      );

      expect(result.current.needsUsdFallback).toBe(true);
      expect(result.current.requestCounterCurrency).toBe("usd");
      expect(result.current.displayCounterCurrency).toBe("cop");
    });

    it("is loading while the supported list has not yet resolved", () => {
      mockSupported(undefined);

      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({ counterCurrency: "cop", isCryptoCountervalue: false }),
      );

      expect(result.current.isResolutionLoading).toBe(true);
      expect(result.current.needsUsdFallback).toBe(false);
      expect(result.current.requestCounterCurrency).toBe("cop");
    });

    it("stops blocking when the supported list errors out", () => {
      mockSupportedError();

      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({ counterCurrency: "cop", isCryptoCountervalue: false }),
      );

      expect(result.current.isResolutionLoading).toBe(false);
    });
  });

  describe("crypto counter currency with fallbackForCryptoCountervalues=true", () => {
    it("falls back to USD for a crypto counter (BTC)", () => {
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
    });

    it("falls back to USD for ETH regardless of case", () => {
      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({
          counterCurrency: "ETH",
          fallbackForCryptoCountervalues: true,
          isCryptoCountervalue: true,
        }),
      );

      expect(result.current.needsUsdFallback).toBe(true);
      expect(result.current.requestCounterCurrency).toBe("usd");
    });

    it("does not wait for the supported list when it is already a crypto fallback", () => {
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
    });
  });

  describe("crypto counter currency with fallbackForCryptoCountervalues=false (default)", () => {
    it("does not fall back to USD for a crypto counter when flag is false", () => {
      const { result } = renderHook(() =>
        useResolveMarketCounterCurrency({ counterCurrency: "btc", isCryptoCountervalue: true }),
      );

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
