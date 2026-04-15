import { createAction } from "@reduxjs/toolkit";
import {
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
} from "@ledgerhq/live-common/currencies/index";
import reducer, {
  addExtraTrackingPairs,
  selectExtraTrackingPairs,
  type CountervaluesExtraTrackingState,
} from "../countervaluesExtraTracking";

const countervaluesWipe = createAction("COUNTERVALUES_WIPE");

const btc = getCryptoCurrencyById("bitcoin");
const usd = getFiatCurrencyByTicker("USD");

const wrap = (state: CountervaluesExtraTrackingState) => ({
  countervaluesExtraTracking: state,
});

describe("countervaluesExtraTracking reducer", () => {
  const initial: CountervaluesExtraTrackingState = { extraTrackingPairs: [] };

  it("should add a new tracking pair", () => {
    const next = reducer(
      initial,
      addExtraTrackingPairs([{ from: btc, to: usd, startDate: new Date() }]),
    );

    expect(selectExtraTrackingPairs(wrap(next))).toHaveLength(1);
  });

  it("should dedupe pairs with the same object references", () => {
    let state = reducer(
      initial,
      addExtraTrackingPairs([{ from: btc, to: usd, startDate: new Date() }]),
    );
    state = reducer(state, addExtraTrackingPairs([{ from: btc, to: usd, startDate: new Date() }]));

    expect(selectExtraTrackingPairs(wrap(state))).toHaveLength(1);
  });

  it("should dedupe pairs with different object references for the same logical currency", () => {
    const btcClone = { ...btc };
    const usdClone = { ...usd };

    let state = reducer(
      initial,
      addExtraTrackingPairs([{ from: btc, to: usd, startDate: new Date() }]),
    );
    state = reducer(
      state,
      addExtraTrackingPairs([{ from: btcClone, to: usdClone, startDate: new Date() }]),
    );

    expect(selectExtraTrackingPairs(wrap(state))).toHaveLength(1);
  });

  it("should allow distinct logical pairs", () => {
    const eth = getCryptoCurrencyById("ethereum");

    const state = reducer(
      initial,
      addExtraTrackingPairs([
        { from: btc, to: usd, startDate: new Date() },
        { from: eth, to: usd, startDate: new Date() },
      ]),
    );

    expect(selectExtraTrackingPairs(wrap(state))).toHaveLength(2);
  });

  it("should reset on COUNTERVALUES_WIPE", () => {
    const populated = reducer(
      initial,
      addExtraTrackingPairs([{ from: btc, to: usd, startDate: new Date() }]),
    );
    const wiped = reducer(populated, countervaluesWipe());

    expect(selectExtraTrackingPairs(wrap(wiped))).toHaveLength(0);
  });
});
