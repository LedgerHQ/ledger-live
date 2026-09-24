import { countervaluesApi } from "@shared/api-services";
import {
  CounterValueIdsSortedByMarketCapSchema,
  RawRatesResponseSchema,
  SpotSimpleResponseSchema,
} from "./internals/schema";
import type {
  CounterValueIdsSortedByMarketCap,
  RatesResponse,
  RawRatesResponse,
  SpotSimpleResponse,
} from "./schema";
import { extractUsdToFiatRate } from "./internals/extractUsdToFiatRate";
import { pickNumericRates } from "./internals/rates";
import { noRetryOptions, RATE_REQUEST_TIMEOUT_MS, rateFetchRetryOptions } from "./internals/retry";
import { COUNTERVALUES_TAGS, describeSchemaFailure } from "./internals/describeSchemaFailure";
import type { HistoricalRatesArgs, SpotRatesArgs } from "./types";

const THIRTY_MINUTES = 30 * 60;
const ONE_MINUTE = 60;

/**
 * Countervalues endpoints, injected into the shared Countervalues Service api.
 *
 * `enhanceEndpoints` and `injectEndpoints` both mutate and return that same api object, so this
 * reference shares its reducer, middleware and cache with every other CVS use case. There is no
 * second `createApi` and no second reducer path.
 *
 * The two rate endpoints set `keepUnusedDataFor: 0`: the countervalues rate store is itself the
 * cache, one merged time series per pair, and a second RTK-keyed cache beside it would be a second
 * source of truth for the same rates.
 */
export const marketCountervaluesApi = countervaluesApi
  .enhanceEndpoints({ addTagTypes: COUNTERVALUES_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      getHistoricalRates: build.query<RatesResponse, HistoricalRatesArgs>({
        query: ({ granularity, from, to, start, end }) => ({
          url: `/v3/historical/${granularity}/simple`,
          params: { from, to, start, end },
          timeout: RATE_REQUEST_TIMEOUT_MS,
        }),
        rawResponseSchema: RawRatesResponseSchema,
        transformResponse: (raw: RawRatesResponse) => pickNumericRates(raw),
        catchSchemaFailure: describeSchemaFailure,
        extraOptions: rateFetchRetryOptions,
        keepUnusedDataFor: 0,
      }),

      getSpotRates: build.query<RatesResponse, SpotRatesArgs>({
        query: ({ to, froms }) => ({
          url: "/v3/spot/simple",
          params: { to, froms: froms.join(",") },
          timeout: RATE_REQUEST_TIMEOUT_MS,
        }),
        rawResponseSchema: RawRatesResponseSchema,
        transformResponse: (raw: RawRatesResponse) => pickNumericRates(raw),
        catchSchemaFailure: describeSchemaFailure,
        extraOptions: rateFetchRetryOptions,
        keepUnusedDataFor: 0,
      }),

      getCounterValueIdsSortedByMarketCap: build.query<CounterValueIdsSortedByMarketCap, void>({
        query: () => "/v3/supported/crypto",
        providesTags: ["CounterValueIdsSortedByMarketCap"],
        keepUnusedDataFor: THIRTY_MINUTES,
        responseSchema: CounterValueIdsSortedByMarketCapSchema,
        catchSchemaFailure: describeSchemaFailure,
        extraOptions: noRetryOptions,
      }),

      getUsdToFiatRate: build.query<number | null, { to: string }>({
        query: ({ to }) => ({
          url: "/v3/spot/simple",
          params: { froms: "usd", to: to.toLowerCase() },
        }),
        serializeQueryArgs: ({ queryArgs }) => ({ to: queryArgs.to.toLowerCase() }),
        providesTags: ["UsdToFiatRate"],
        rawResponseSchema: SpotSimpleResponseSchema,
        catchSchemaFailure: describeSchemaFailure,
        transformResponse: (res: SpotSimpleResponse) => extractUsdToFiatRate(res),
        extraOptions: noRetryOptions,
        keepUnusedDataFor: ONE_MINUTE,
      }),
    }),
  });

export const { useGetCounterValueIdsSortedByMarketCapQuery, useGetUsdToFiatRateQuery } =
  marketCountervaluesApi;

export type MarketCountervaluesApi = typeof marketCountervaluesApi;
