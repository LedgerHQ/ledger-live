// Package-private, except `FIFTEEN_MINUTES_IN_MS` which `api.ts` re-exports from the public barrel.

/** RTK Query cache tags exposed by the market-sentiment api. */
export const FEAR_AND_GREED_TAGS = ["FearAndGreedLatest"] as const;

/** RTK Query reducer path for the market-sentiment API — stable; it keys the store slice. */
export const MARKET_SENTIMENT_REDUCER_PATH = "marketSentimentApi";

const ONE_MINUTE_IN_SECONDS = 60;

/** Cache lifetime matching CMC's 15-minute update frequency, expressed in seconds for RTK Query. */
export const FIFTEEN_MINUTES_IN_SECONDS = 15 * ONE_MINUTE_IN_SECONDS;

const ONE_MINUTE_IN_MS = 60 * 1000;

/** Polling interval matching CMC's 15-minute update frequency, in milliseconds. */
export const FIFTEEN_MINUTES_IN_MS = 15 * ONE_MINUTE_IN_MS;
