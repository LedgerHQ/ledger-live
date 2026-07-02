import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FiatCurrency } from "./schema";
import { getFiatCurrencyByTicker } from "./registry";

export const OFAC_FIAT_TICKERS: ReadonlySet<string> = new Set([
  "AFN",
  "BYN",
  "CUP",
  "CUC",
  "IRR",
  "IQD",
  "KPW",
  "RUB",
  "SDG",
  "SYP",
  "MMK",
]);

const FALLBACK_FIAT_TICKERS = [
  "AED",
  "AUD",
  "BHD",
  "BRL",
  "CAD",
  "CHF",
  "CLP",
  "CNY",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "HKD",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "JPY",
  "KRW",
  "MXN",
  "MYR",
  "NGN",
  "NOK",
  "NZD",
  "PHP",
  "PKR",
  "PLN",
  "RUB",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "UAH",
  "USD",
  "VND",
  "ZAR",
];

function buildFallbackFiats(): FiatCurrency[] {
  return FALLBACK_FIAT_TICKERS.filter(t => !OFAC_FIAT_TICKERS.has(t))
    .map(ticker => getFiatCurrencyByTicker(ticker))
    .filter((c): c is FiatCurrency => c !== undefined);
}

export type SupportedFiatsState = {
  fiats: FiatCurrency[];
};

const initialState: SupportedFiatsState = { fiats: buildFallbackFiats() };

export const supportedFiatsSlice = createSlice({
  name: "supportedFiats",
  initialState,
  reducers: {
    setFiats: (state, action: PayloadAction<FiatCurrency[]>) => {
      if (action.payload.length > 0) {
        state.fiats = action.payload;
      }
    },
  },
});

export const { setFiats } = supportedFiatsSlice.actions;

export function selectSupportedFiats(state: {
  supportedFiats: SupportedFiatsState;
}): FiatCurrency[] {
  return state.supportedFiats.fiats;
}
