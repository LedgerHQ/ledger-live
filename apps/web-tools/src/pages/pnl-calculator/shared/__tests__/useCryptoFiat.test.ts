import { renderHook } from "@testing-library/react";
import type { FiatCurrency } from "@ledgerhq/types-cryptoassets";

jest.mock("@domain/entity-currency-fiat", () => ({
  getFiatCurrencyByTicker: jest.fn(),
}));

import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { useCryptoFiat } from "../useCryptoFiat";

const mockGetFiatCurrencyByTicker = getFiatCurrencyByTicker as jest.Mock;

const EUR_FIAT = { id: "eur", ticker: "EUR", name: "Euro", units: [] } as unknown as FiatCurrency;

describe("useCryptoFiat", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the fiat currency for a known ticker", () => {
    mockGetFiatCurrencyByTicker.mockReturnValue(EUR_FIAT);
    const { result } = renderHook(() => useCryptoFiat("EUR"));
    expect(result.current).toBe(EUR_FIAT);
    expect(mockGetFiatCurrencyByTicker).toHaveBeenCalledWith("EUR");
  });

  it("throws for an unknown ticker", () => {
    mockGetFiatCurrencyByTicker.mockReturnValue(undefined);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useCryptoFiat("ZZZ_UNKNOWN"))).toThrow(
      "Unknown fiat currency ticker: ZZZ_UNKNOWN",
    );
    errorSpy.mockRestore();
  });
});
