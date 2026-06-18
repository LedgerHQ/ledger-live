import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FiatCurrency } from "@domain/entity-currency-fiat";
import { SUPPORTED_FIATS_INITIAL_STATE } from "./schema";

const supportedFiatsSlice = createSlice({
  name: "supportedFiats",
  initialState: SUPPORTED_FIATS_INITIAL_STATE,
  reducers: {
    /** Replaces the resolved supported fiats. */
    setSupportedFiats(state, action: PayloadAction<FiatCurrency[]>) {
      state.currencies = action.payload;
    },
  },
});

export const { setSupportedFiats } = supportedFiatsSlice.actions;

/** Reducer for the `supportedFiats` slice — register under `state.supportedFiats`. */
export const supportedFiatsReducer = supportedFiatsSlice.reducer;
