/**
 * @jest-environment jsdom
 */
import { createElement, type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { counterValuesApi } from "../../../counterValues/state-manager/api";
import { usePickDefaultCurrency } from "./usePickDefaultCurrency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

// Suppress the inevitable network error (countervalues API is not available in tests).
beforeAll(() => {
  jest.spyOn(global, "fetch").mockResolvedValue(new Response("[]", { status: 503 }));
});
afterAll(() => jest.restoreAllMocks());

// Real store with the counterValues RTK Query reducer.
// useGetCounterValueIdsSortedByMarketCapQuery returns { data: undefined } initially,
// so useCurrenciesByMarketcap falls back to original currency order.
const store = configureStore({
  reducer: { [counterValuesApi.reducerPath]: counterValuesApi.reducer },
  middleware: getDefault => getDefault().concat(counterValuesApi.middleware),
});
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(Provider, { store }, children);

describe("usePickDefaultCurrency", () => {
  const setCurrency = jest.fn();

  beforeEach(() => {
    setCurrency.mockClear();
  });

  test("do nothing when the passed currency is valid", () => {
    const currencies: (CryptoCurrency | TokenCurrency)[] = [
      getCryptoCurrencyById("ethereum"),
      getCryptoCurrencyById("bitcoin"),
      getCryptoCurrencyById("bsc"),
    ];

    renderHook(
      () => usePickDefaultCurrency(currencies, getCryptoCurrencyById("ethereum"), setCurrency),
      { wrapper },
    );

    expect(setCurrency).toHaveBeenCalledTimes(0);
  });

  // The original code fired currenciesByMarketcap().then(sorted => setCurrency(sorted[0]))
  // asynchronously when no ETH/BTC was found, so the synchronous test assertion could not
  // observe it. The synchronous hook version makes this visible. The pre-select product
  // question (which currency should be the default when neither ETH nor BTC is available)
  // is tracked separately; these tests now assert the actual observable behaviour.
  test("selects the first sorted currency if no eth/btc and no currency is set", () => {
    const solanaCurrency = getCryptoCurrencyById("solana");
    const currencies: (CryptoCurrency | TokenCurrency)[] = [
      solanaCurrency,
      getCryptoCurrencyById("polkadot"),
      getCryptoCurrencyById("bsc"),
    ];

    renderHook(() => usePickDefaultCurrency(currencies, undefined, setCurrency), { wrapper });

    expect(setCurrency).toHaveBeenCalledTimes(1);
    expect(setCurrency).toHaveBeenCalledWith(solanaCurrency);
  });

  test("selects the first sorted currency if no eth/btc and the set currency is invalid", () => {
    const solanaCurrency = getCryptoCurrencyById("solana");
    const currencies: (CryptoCurrency | TokenCurrency)[] = [
      solanaCurrency,
      getCryptoCurrencyById("polkadot"),
      getCryptoCurrencyById("bsc"),
    ];

    renderHook(
      () => usePickDefaultCurrency(currencies, getCryptoCurrencyById("stellar"), setCurrency),
      { wrapper },
    );

    expect(setCurrency).toHaveBeenCalledTimes(1);
    expect(setCurrency).toHaveBeenCalledWith(solanaCurrency);
  });

  test("returns the ethereum currency if the passed currency isn't valid and ethereum comes before bitcoin in the list", () => {
    const ethereumCurrency = getCryptoCurrencyById("ethereum");

    const currencies: (CryptoCurrency | TokenCurrency)[] = [
      getCryptoCurrencyById("bsc"),
      ethereumCurrency,
      getCryptoCurrencyById("bitcoin"),
      getCryptoCurrencyById("polkadot"),
    ];

    renderHook(
      () => usePickDefaultCurrency(currencies, getCryptoCurrencyById("stellar"), setCurrency),
      { wrapper },
    );

    expect(setCurrency).toHaveBeenCalledTimes(1);
    expect(setCurrency).toHaveBeenCalledWith(ethereumCurrency);
  });

  test("returns the bitcoin currency if the passed currency isn't valid and bitcoin comes before ethereum in the list", () => {
    const bitcoinCurrency = getCryptoCurrencyById("bitcoin");

    const currencies: (CryptoCurrency | TokenCurrency)[] = [
      getCryptoCurrencyById("bsc"),
      bitcoinCurrency,
      getCryptoCurrencyById("ethereum"),
      getCryptoCurrencyById("polkadot"),
    ];

    renderHook(
      () => usePickDefaultCurrency(currencies, getCryptoCurrencyById("stellar"), setCurrency),
      { wrapper },
    );

    expect(setCurrency).toHaveBeenCalledTimes(1);
    expect(setCurrency).toHaveBeenCalledWith(bitcoinCurrency);
  });
});
