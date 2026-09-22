import type { NamedSchemaError } from "@reduxjs/toolkit/query";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { countervaluesApi } from "@shared/api-services";
import {
  CounterValueIdsSortedByMarketCapSchema,
  RawRatesResponseSchema,
  SpotSimpleResponseSchema,
  type CounterValueIdsSortedByMarketCap,
  type RatesResponse,
  type RawRatesResponse,
  type SpotSimpleResponse,
} from "./schema";
import { extractUsdToFiatRate } from "./internals/extractUsdToFiatRate";
import { pickNumericRates } from "./internals/rates";
import { rateFetchRetryOptions } from "./internals/retry";
import type { HistoricalRatesArgs, SpotRatesArgs } from "./types";

const THIRTY_MINUTES = 30 * 60;
const ONE_MINUTE = 60;

/** RTK Query cache tags owned by the countervalues use case. */
export const COUNTERVALUES_TAGS = ["CounterValueIdsSortedByMarketCap", "UsdToFiatRate"] as const;

/**
 * Turns a rejected response schema into a typed error instead of logging it.
 *
 * This package injects into a shared api and takes no logging dependency, so it has nowhere to log
 * from: `SchemaFailureInfo` carries only `endpoint`, `arg`, `type` and `queryCacheKey`, never the
 * thunk `extraArgument`. Surfacing the issues on the error is what `@shared/api-services`' Card
 * service does for the same reason, and it puts the detail where the caller can act on it.
 */
export function describeSchemaFailure(error: NamedSchemaError): FetchBaseQueryError {
  const issues = error.issues
    .map(issue => {
      const path = issue.path?.map(String).join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");

  return {
    status: "CUSTOM_ERROR",
    error: `${error.schemaName} rejected the response — ${issues}`,
  };
}

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
        keepUnusedDataFor: ONE_MINUTE,
      }),
    }),
  });

export const { useGetCounterValueIdsSortedByMarketCapQuery, useGetUsdToFiatRateQuery } =
  marketCountervaluesApi;

export type MarketCountervaluesApi = typeof marketCountervaluesApi;
