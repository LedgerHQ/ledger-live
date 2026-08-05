/**
 * @jest-environment jsdom
 */

import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { renderHook } from "@testing-library/react";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useMarketByCurrencies } from "../useMarketByCurrencies";
import type { ApiState } from "../../entities/selectorUtils";

const currency = (id: string) => ({ id }) as CryptoOrTokenCurrency;

function renderWithMarkets(markets: Record<string, unknown>, currencies: CryptoOrTokenCurrency[]) {
  const state = {
    assetsDataApi: { queries: { a: { data: { pages: [{ markets }] } } } },
  } as ApiState;
  const store = configureStore({ reducer: () => state });

  return renderHook(() => useMarketByCurrencies(currencies), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });
}

describe("useMarketByCurrencies", () => {
  it("maps each currency id to its price and 24h change", () => {
    const { result } = renderWithMarkets(
      {
        bitcoin: { price: 65000, priceChangePercentage24h: 1.5 },
        ethereum: { price: 3200, priceChangePercentage24h: -2.25 },
      },
      [currency("bitcoin"), currency("ethereum")],
    );

    expect(result.current).toEqual({
      bitcoin: { price: 65000, priceChangePercentage24h: 1.5 },
      ethereum: { price: 3200, priceChangePercentage24h: -2.25 },
    });
  });

  it("returns an empty map for an empty currency list", () => {
    const { result } = renderWithMarkets(
      { bitcoin: { price: 1, priceChangePercentage24h: 1 } },
      [],
    );

    expect(result.current).toEqual({});
  });

  it("omits a currency that has no cached market entry", () => {
    const { result } = renderWithMarkets(
      { bitcoin: { price: 65000, priceChangePercentage24h: 1 } },
      [currency("bitcoin"), currency("solana")],
    );

    expect(result.current).toEqual({ bitcoin: { price: 65000, priceChangePercentage24h: 1 } });
    expect(result.current).not.toHaveProperty("solana");
  });

  describe("requires both price and 24h change", () => {
    it("omits an entry that has a price but no 24h change", () => {
      const { result } = renderWithMarkets({ bitcoin: { price: 65000 } }, [currency("bitcoin")]);

      expect(result.current).toEqual({});
    });

    it("omits an entry that has a 24h change but no price", () => {
      const { result } = renderWithMarkets({ bitcoin: { priceChangePercentage24h: 1.5 } }, [
        currency("bitcoin"),
      ]);

      expect(result.current).toEqual({});
    });

    it("keeps valid siblings when one entry is incomplete", () => {
      const { result } = renderWithMarkets(
        {
          bitcoin: { price: 65000 },
          ethereum: { price: 3200, priceChangePercentage24h: 1 },
        },
        [currency("bitcoin"), currency("ethereum")],
      );

      expect(result.current).toEqual({ ethereum: { price: 3200, priceChangePercentage24h: 1 } });
    });
  });

  describe("zero is a value, not an absence", () => {
    it("keeps an entry whose price is zero", () => {
      const { result } = renderWithMarkets({ bitcoin: { price: 0, priceChangePercentage24h: 1 } }, [
        currency("bitcoin"),
      ]);

      expect(result.current.bitcoin).toEqual({ price: 0, priceChangePercentage24h: 1 });
    });

    it("keeps an entry whose 24h change is zero", () => {
      const { result } = renderWithMarkets(
        { bitcoin: { price: 65000, priceChangePercentage24h: 0 } },
        [currency("bitcoin")],
      );

      expect(result.current.bitcoin).toEqual({ price: 65000, priceChangePercentage24h: 0 });
    });
  });

  describe("rounds the 24h change to two decimals", () => {
    /*
     * Values verified against the implementation. Rounding is `Math.round(x * 100) / 100`,
     * so results follow binary float representation rather than decimal intuition:
     * -2.345 * 100 is -234.50000000000003, which rounds away from zero, while
     * -1.005 * 100 is -100.49999999999999, which rounds towards it.
     */
    it.each([
      [1.23456, 1.23],
      [1.235, 1.24],
      [-2.345, -2.35],
      [-1.005, -1],
      [0.005, 0.01],
      [99.999, 100],
      [1.2, 1.2],
    ])("rounds %p to %p", (input, expected) => {
      const { result } = renderWithMarkets(
        { bitcoin: { price: 1, priceChangePercentage24h: input } },
        [currency("bitcoin")],
      );

      expect(result.current.bitcoin?.priceChangePercentage24h).toBe(expected);
    });

    it("rounds an exact .5 towards positive infinity, so sign changes the magnitude", () => {
      const positive = renderWithMarkets(
        { bitcoin: { price: 1, priceChangePercentage24h: 0.125 } },
        [currency("bitcoin")],
      );
      const negative = renderWithMarkets(
        { bitcoin: { price: 1, priceChangePercentage24h: -0.125 } },
        [currency("bitcoin")],
      );

      expect(positive.result.current.bitcoin?.priceChangePercentage24h).toBe(0.13);
      expect(negative.result.current.bitcoin?.priceChangePercentage24h).toBe(-0.12);
    });

    it("leaves the price unrounded", () => {
      const { result } = renderWithMarkets(
        { bitcoin: { price: 65000.123456, priceChangePercentage24h: 1 } },
        [currency("bitcoin")],
      );

      expect(result.current.bitcoin?.price).toBe(65000.123456);
    });
  });

  it("drops fields other than price and 24h change", () => {
    const { result } = renderWithMarkets(
      { bitcoin: { price: 65000, priceChangePercentage24h: 1, marketCap: 1_280_000_000_000 } },
      [currency("bitcoin")],
    );

    expect(result.current.bitcoin).toEqual({ price: 65000, priceChangePercentage24h: 1 });
  });

  it("keeps the same reference across re-renders when the content is unchanged", () => {
    const currencies = [currency("bitcoin")];
    const { result, rerender } = renderWithMarkets(
      { bitcoin: { price: 65000, priceChangePercentage24h: 1 } },
      currencies,
    );

    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });
});
