import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FiatCurrency } from "./schema";
import type { SupportedFiatsState } from "./types";
import { buildFallbackFiats } from "./internals";

const initialState: SupportedFiatsState = { fiats: buildFallbackFiats(), fiatsReady: false };

export const supportedFiatsSlice = createSlice({
  name: "supportedFiats",
  initialState,
  reducers: {
    /**
     * Replaces the supported-fiat list with CVS-resolved fiat currencies.
     * No-op when `payload` is empty so the OFAC-filtered fallback is
     * preserved on transient network failures.
     */
    setFiats: (state, action: PayloadAction<FiatCurrency[]>) => {
      if (action.payload.length > 0) {
        state.fiats = action.payload;
      }
    },
    /** Signals that the first CVS query has settled. Idempotent. Never persisted. */
    setFiatsReady: state => {
      state.fiatsReady = true;
    },
  },
});

export const { setFiats, setFiatsReady } = supportedFiatsSlice.actions;
