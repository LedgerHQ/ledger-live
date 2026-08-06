import { buildCategoryResponse } from "./categoryResponse.mock";

const STABLECOIN_TICKERS = [
  "USDT",
  "USDC",
  "USDS",
  "USDE",
  "DAI",
  "USD1",
  "PYUSD",
  "PAXG",
  "USDG",
  "RLUSD",
  "USDD",
  "TUSD",
  "EURC",
  "FDUSD",
  "CRVUSD",
  "FRAX",
  "AUSD",
  "BUSD",
  "EURI",
  "GUSD",
];

/*
 * The category endpoints keep one field per asset, so tickers alone are enough here: the
 * stablecoins list is consumed as tickers and never resolved to currencies.
 */
export const mockStablecoinsResponse = buildCategoryResponse(
  STABLECOIN_TICKERS.map(ticker => ({ ticker })),
);
