import { createSlice, freeze } from "@reduxjs/toolkit";
import { setCountervaluesState, wipeCountervalues } from "./actions";
import { initialState } from "./logic";

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
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(setCountervaluesState, (_state, { payload }) => freeze(payload))
      .addCase(wipeCountervalues, () => initialState);
  },
});
