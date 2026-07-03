import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FiatCurrency } from "./schema";
import type { SupportedFiatsState } from "./types";
import { buildFallbackFiats } from "./internals";

const initialState: SupportedFiatsState = { fiats: buildFallbackFiats() };

export const supportedFiatsSlice = createSlice({
  name: "supportedFiats",
  initialState,
  reducers: {
    /**
     * Replaces the supported-fiat list with the CVS-supplied tickers.
     * No-op when `payload` is empty so the OFAC-filtered fallback is
     * preserved on transient network failures.
     */
    setFiats: (state, action: PayloadAction<FiatCurrency[]>) => {
      if (action.payload.length > 0) {
        state.fiats = action.payload;
      }
    },
  },
});

export const { setFiats } = supportedFiatsSlice.actions;
