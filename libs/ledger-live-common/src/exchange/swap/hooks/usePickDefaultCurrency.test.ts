/**
 * @jest-environment jsdom
 */
import { createElement, type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { usePickDefaultCurrency } from "./usePickDefaultCurrency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

// Minimal store: assetsDataApi has no cached DADA data, so useCurrenciesByMarketcap
// returns currencies in their original order (the no-DADA-cache fallback path).
const store = configureStore({ reducer: { assetsDataApi: () => ({ queries: {} }) } });
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

  // NOTE: the two tests below are EXPECTED TO FAIL.
  //
  // When the currency list contains neither ETH nor BTC, the original code called
  //   currenciesByMarketcap(currencies).then(sorted => setCurrency(sorted[0]))
  // That promise resolved in production (users got a default), but tests never saw it
  // because renderHook completes synchronously before .then() fires.
  //
  // The synchronous hook version makes the behaviour visible: the fallback now fires
  // synchronously and these tests fail. This surfaces an existing contradiction between
  // the test intent ("do nothing") and the original production intent ("pick top-sorted").
  // Which behaviour is correct is a product decision for reviewers; it is not resolved here.
  test("do nothing if the currency is undefined/null and the currencies list don't include eth/btc", () => {
    const currencies: (CryptoCurrency | TokenCurrency)[] = [
      getCryptoCurrencyById("solana"),
      getCryptoCurrencyById("polkadot"),
      getCryptoCurrencyById("bsc"),
    ];

    renderHook(() => usePickDefaultCurrency(currencies, undefined, setCurrency), { wrapper });

    expect(setCurrency).toHaveBeenCalledTimes(0);
  });

  test("do nothing if the currency passed isn't valid in the list and the currencies list don't include eth/btc", () => {
    const currencies: (CryptoCurrency | TokenCurrency)[] = [
      getCryptoCurrencyById("solana"),
      getCryptoCurrencyById("polkadot"),
      getCryptoCurrencyById("bsc"),
    ];

    renderHook(
      () => usePickDefaultCurrency(currencies, getCryptoCurrencyById("stellar"), setCurrency),
      { wrapper },
    );

    expect(setCurrency).toHaveBeenCalledTimes(0);
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
