/** RTK Query reducer path for the CoinMarketCap service — stable; it keys the store slice. */
export const COIN_MARKET_CAP_REDUCER_PATH = "coinMarketCapApi";

const ONE_MINUTE_IN_SECONDS = 60;

/** Cache lifetime matching CMC's 15-minute update frequency, expressed in seconds for RTK Query. */
export const FIFTEEN_MINUTES_IN_SECONDS = 15 * ONE_MINUTE_IN_SECONDS;

const ONE_MINUTE_IN_MS = 60 * 1000;

/** Polling interval matching CMC's 15-minute update frequency, in milliseconds. */
export const FIFTEEN_MINUTES_IN_MS = 15 * ONE_MINUTE_IN_MS;
