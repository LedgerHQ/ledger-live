/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";

import { useSelectableCurrencies } from "./useSelectableCurrencies";
import { getCryptoCurrencyById } from "../../../currencies";

describe("useSelectableCurrencies", () => {
  test("returns an empty array when empty list are passed", () => {
    const allCurrencies = [];

    const { result } = renderHook(() => useSelectableCurrencies({ allCurrencies }));

    expect(result.current).toEqual([]);
  });

  test("returns an empty array when incorrect ids are passed", () => {
    const allCurrencies = ["ethercoin", "bitether", "polkamos"];

    const { result } = renderHook(() => useSelectableCurrencies({ allCurrencies }));

    expect(result.current).toEqual([]);
  });

  test("returns correct currencies for all correct ids, in the same order", () => {
    const allCurrencies = ["ethereum", "bitcoin", "polkamos"];
    const ethereumCurrency = getCryptoCurrencyById("ethereum");
    const bitcoinCurrency = getCryptoCurrencyById("bitcoin");

    const { result } = renderHook(() => useSelectableCurrencies({ allCurrencies }));

    expect(result.current).toHaveLength(2);
    expect(result.current).toEqual([ethereumCurrency, bitcoinCurrency]);
  });
});
