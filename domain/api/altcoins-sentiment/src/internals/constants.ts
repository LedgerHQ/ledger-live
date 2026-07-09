// Package-private, re-exports from the public barrel.

/** RTK Query cache tags exposed by the altcoins-sentiment api. */
export const ALTCOIN_SEASON_INDEX_TAGS = ["AltcoinSeasonIndexLatest"] as const;

/** RTK Query reducer path for the altcoins-sentiment API — stable; it keys the store slice. */
export const ALTCOINS_SENTIMENT_REDUCER_PATH = "altcoinsSentimentApi";

const ONE_MINUTE_IN_SECONDS = 60;

/** Cache lifetime matching CMC's 15-minute update frequency, expressed in seconds for RTK Query. */
export const FIFTEEN_MINUTES_IN_SECONDS = 15 * ONE_MINUTE_IN_SECONDS;

const ONE_MINUTE_IN_MS = 60 * 1000;

/** Polling interval matching CMC's 15-minute update frequency, in milliseconds. */
export const FIFTEEN_MINUTES_IN_MS = 15 * ONE_MINUTE_IN_MS;
