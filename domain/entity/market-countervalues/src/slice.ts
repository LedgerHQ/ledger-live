import { createSlice, freeze, type PayloadAction } from "@reduxjs/toolkit";
import { initialState } from "./logic";
import type { CounterValuesState } from "./types";

/**
 * The rates. `@features/platform-market-countervalues` mounts this slice at `countervalues.rates`.
 *
 * A stored state is frozen shallowly: immer would otherwise walk every entry of every rate `Map` on
 * each load, which costs about as much as the load itself. Nothing writes into a stored state:
 * `loadCountervalues` copies each `Map` it patches.
 */
export const countervaluesRatesSlice = createSlice({
  name: "countervaluesRates",
  initialState,
  reducers: {
    /** Replaces the stored rates with a freshly loaded or restored state. */
    set: (_state, { payload }: PayloadAction<CounterValuesState>) => freeze(payload),
    /** Drops every stored rate. */
    wipe: () => initialState,
  },
});

export const { set: setCountervaluesState, wipe: wipeCountervalues } =
  countervaluesRatesSlice.actions;
