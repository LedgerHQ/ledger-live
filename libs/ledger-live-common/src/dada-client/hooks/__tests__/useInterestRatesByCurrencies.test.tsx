/**
 * @jest-environment jsdom
 */

import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { renderHook } from "@testing-library/react";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useInterestRatesByCurrencies } from "../useInterestRatesByCurrencies";
import type { ApiState } from "../../entities/selectorUtils";

const currency = (id: string) => ({ id }) as CryptoOrTokenCurrency;

const rate = (currencyId: string, value: number, type: string) => ({
  currencyId,
  rate: value,
  type,
  fetchAt: "2026-07-31T00:00:00.000Z",
});

function renderWithRates(
  interestRates: Record<string, unknown>,
  currencies: CryptoOrTokenCurrency[],
) {
  const state = {
    assetsDataApi: { queries: { a: { data: { pages: [{ interestRates }] } } } },
  } as ApiState;
  const store = configureStore({ reducer: () => state });

  return renderHook(() => useInterestRatesByCurrencies(currencies), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });
}

describe("useInterestRatesByCurrencies", () => {
  it("maps each currency id to its rate value and type", () => {
    const { result } = renderWithRates(
      { bitcoin: rate("bitcoin", 4.2, "APY"), ethereum: rate("ethereum", 3.1, "APR") },
      [currency("bitcoin"), currency("ethereum")],
    );

    expect(result.current).toEqual({
      bitcoin: { value: 4.2, type: "APY" },
      ethereum: { value: 3.1, type: "APR" },
    });
  });

  it("returns an empty map for an empty currency list", () => {
    const { result } = renderWithRates({ bitcoin: rate("bitcoin", 4.2, "APY") }, []);

    expect(result.current).toEqual({});
  });

  it("omits a currency that has no cached rate", () => {
    const { result } = renderWithRates({ bitcoin: rate("bitcoin", 4.2, "APY") }, [
      currency("bitcoin"),
      currency("solana"),
    ]);

    expect(result.current).toEqual({ bitcoin: { value: 4.2, type: "APY" } });
    expect(result.current).not.toHaveProperty("solana");
  });

  describe("apy type validation", () => {
    it.each(["NRR", "APY", "APR"])("accepts the %s type", type => {
      const { result } = renderWithRates({ bitcoin: rate("bitcoin", 4.2, type) }, [
        currency("bitcoin"),
      ]);

      expect(result.current.bitcoin).toEqual({ value: 4.2, type });
    });

    it.each(["", "apy", "UNKNOWN", "STAKING"])("drops the unrecognised type %p", type => {
      const { result } = renderWithRates({ bitcoin: rate("bitcoin", 4.2, type) }, [
        currency("bitcoin"),
      ]);

      expect(result.current).toEqual({});
    });

    it("drops an entry with an unrecognised type but keeps its valid siblings", () => {
      const { result } = renderWithRates(
        { bitcoin: rate("bitcoin", 4.2, "NOPE"), ethereum: rate("ethereum", 3.1, "APY") },
        [currency("bitcoin"), currency("ethereum")],
      );

      expect(result.current).toEqual({ ethereum: { value: 3.1, type: "APY" } });
    });
  });

  it("passes a zero rate through rather than treating it as absent", () => {
    const { result } = renderWithRates({ bitcoin: rate("bitcoin", 0, "APY") }, [
      currency("bitcoin"),
    ]);

    expect(result.current.bitcoin).toEqual({ value: 0, type: "APY" });
  });

  it("keeps the same reference across re-renders when the content is unchanged", () => {
    const currencies = [currency("bitcoin")];
    const { result, rerender } = renderWithRates(
      { bitcoin: rate("bitcoin", 4.2, "APY") },
      currencies,
    );

    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });
});
