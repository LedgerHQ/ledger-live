import React from "react";
import { renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { BigNumber } from "bignumber.js";
import { buildCV } from "@domain/entity-market-countervalues/mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { countervaluesInitialState, countervaluesReducer } from "../state/reducer";
import { useSortByFiatValue, type FiatValueEntry } from "./useSortByFiatValue";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const usd = getFiatCurrencyByTicker("USD");
const oneBitcoin = new BigNumber(10).pow(bitcoin.units[0].magnitude);

// Only bitcoin has a rate: ethereum items have no countervalue.
const rates = buildCV({ pair: { from: bitcoin, to: usd }, latest: 30_000 });

type Item = { name: string; currency: FiatValueEntry["currency"]; balance: BigNumber };
const getEntry = ({ currency, balance }: Item): FiatValueEntry => ({ currency, value: balance });

const btc = (name: string, amount: number): Item => ({
  name,
  currency: bitcoin,
  balance: oneBitcoin.times(amount),
});

function sortNames(items: Item[]) {
  const store = configureStore({
    reducer: { countervalues: countervaluesReducer },
    preloadedState: { countervalues: { ...countervaluesInitialState, rates } },
    middleware: getDefault => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    // oxlint-disable-next-line react/no-children-prop
    React.createElement(Provider, { store, children });
  const { result } = renderHook(() => useSortByFiatValue(items, getEntry, usd), { wrapper });
  return result.current.map(item => item.name);
}

describe("useSortByFiatValue (accounts sorted by their value in USD)", () => {
  it("puts the account worth the most first, whatever order they come in", () => {
    expect(sortNames([btc("A", 1), btc("B", 3), btc("C", 2)])).toEqual(["B", "C", "A"]);
  });

  it("puts accounts with no known price last, and keeps equal ones in their original order", () => {
    const noRate: Item = { name: "NoRate", currency: ethereum, balance: new BigNumber(10).pow(18) };

    expect(sortNames([noRate, btc("Zero", 0), btc("Low", 1), btc("High", 2)])).toEqual([
      "High",
      "Low",
      "NoRate",
      "Zero",
    ]);
  });

  it("leaves the original list untouched", () => {
    const items = [btc("A", 1), btc("B", 2)];
    sortNames(items);

    expect(items.map(item => item.name)).toEqual(["A", "B"]);
  });
});
