/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import {
  useResolveMarketCounterCurrency,
  type MarketCounterCurrencyResolution,
} from "../useResolveMarketCounterCurrency";
import { useSupportedCounterCurrencies } from "../../../cg-client/hooks/useCoingeckoDataProvider";

jest.mock("../../../cg-client/hooks/useCoingeckoDataProvider", () => ({
  useSupportedCounterCurrencies: jest.fn(),
}));

const mockUseSupportedCounterCurrencies = jest.mocked(useSupportedCounterCurrencies);

const SUPPORTED = ["usd", "eur", "vnd", "btc", "eth"];

const mockSupported = (...args: [] | [string[] | undefined]) =>
  mockUseSupportedCounterCurrencies.mockReturnValue({
    data: args.length === 0 ? SUPPORTED : args[0],
  } as unknown as ReturnType<typeof useSupportedCounterCurrencies>);

const resolve = (
  params: Parameters<typeof useResolveMarketCounterCurrency>[0],
): MarketCounterCurrencyResolution =>
  renderHook(() => useResolveMarketCounterCurrency(params)).result.current;

describe("useResolveMarketCounterCurrency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupported();
  });

  it("falls back to USD for a crypto ticker (BTC), case-insensitively", () => {
    const result = resolve({ counterCurrency: "BTC", fallbackForCryptoCountervalues: true });

    expect(result.needsUsdFallback).toBe(true);
    expect(result.requestCounterCurrency).toBe("usd");
  });

  it("requests a supported fiat ticker (EUR) natively", () => {
    const result = resolve({ counterCurrency: "EUR", fallbackForCryptoCountervalues: true });

    expect(result.needsUsdFallback).toBe(false);
    expect(result.requestCounterCurrency).toBe("eur");
  });

  it("does not misdetect a ticker outside the countervalue set (CRO) as crypto", () => {
    mockSupported(["usd", "eur"]);

    const result = resolve({ counterCurrency: "CRO", fallbackForCryptoCountervalues: true });

    expect(result.needsUsdFallback).toBe(true);
  });

  it("skips the fallback entirely when fallbackForCryptoCountervalues is false, even for a crypto ticker", () => {
    const result = resolve({ counterCurrency: "btc", fallbackForCryptoCountervalues: false });

    expect(result.needsUsdFallback).toBe(false);
    expect(result.requestCounterCurrency).toBe("btc");
  });
});
