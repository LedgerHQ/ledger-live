import { renderHook } from "@testing-library/react-hooks";

import { usePickDefaultCurrency } from "./usePickDefaultCurrency";
import { getCryptoCurrencyById } from "../../../currencies";
import { CryptoCurrency, TokenCurrency } from "../../../types";

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

    renderHook(() =>
      usePickDefaultCurrency(
        currencies,
        getCryptoCurrencyById("ethereum"),
        setCurrency
      )
    );

    expect(setCurrency).toHaveBeenCalledTimes(0);
  });

  test("do nothing if the currency is undefined/null and the currencies list don't include eth/btc", () => {
    const currencies: (CryptoCurrency | TokenCurrency)[] = [
      getCryptoCurrencyById("solana"),
      getCryptoCurrencyById("polkadot"),
      getCryptoCurrencyById("bsc"),
    ];

    renderHook(() =>
      usePickDefaultCurrency(currencies, undefined, setCurrency)
    );

    expect(setCurrency).toHaveBeenCalledTimes(0);
  });

  test("do nothing if the currency passed isn't valid in the list and the currencies list don't include eth/btc", () => {
    const currencies: (CryptoCurrency | TokenCurrency)[] = [
      getCryptoCurrencyById("solana"),
      getCryptoCurrencyById("polkadot"),
      getCryptoCurrencyById("bsc"),
    ];

    renderHook(() =>
      usePickDefaultCurrency(
        currencies,
        getCryptoCurrencyById("stellar"),
        setCurrency
      )
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

    renderHook(() =>
      usePickDefaultCurrency(
        currencies,
        getCryptoCurrencyById("stellar"),
        setCurrency
      )
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

    renderHook(() =>
      usePickDefaultCurrency(
        currencies,
        getCryptoCurrencyById("stellar"),
        setCurrency
      )
    );

    expect(setCurrency).toHaveBeenCalledTimes(1);
    expect(setCurrency).toHaveBeenCalledWith(bitcoinCurrency);
  });
});
