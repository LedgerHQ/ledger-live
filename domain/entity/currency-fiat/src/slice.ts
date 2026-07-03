import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FiatCurrency } from "./schema";
import { getFiatCurrencyByTicker } from "./registry";
import { OFAC_FIAT_TICKERS, FALLBACK_FIAT_TICKERS } from "./constants";
import type { SupportedFiatsState } from "./types";

function buildFallbackFiats(): FiatCurrency[] {
  return FALLBACK_FIAT_TICKERS.filter(t => !OFAC_FIAT_TICKERS.has(t))
    .map(ticker => getFiatCurrencyByTicker(ticker))
    .filter((c): c is FiatCurrency => c !== undefined);
}

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

/**
 * Selects the current runtime-supported fiat currencies from the Redux store.
 */
export function selectSupportedFiats(state: {
  supportedFiats: SupportedFiatsState;
}): FiatCurrency[] {
  return state.supportedFiats.fiats;
}
