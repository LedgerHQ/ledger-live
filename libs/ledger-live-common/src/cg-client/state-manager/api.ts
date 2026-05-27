import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@ledgerhq/live-env";
import { log } from "@ledgerhq/logs";
import { SupportedCoins } from "../utils/types";
import { GcDataTags, SupportedCoinsSchema, SupportedCounterCurrenciesSchema } from "./types";

function transformSupportedCoinsResponse(response: unknown): SupportedCoins {
  const result = SupportedCoinsSchema.safeParse(response);

  if (!result.success) {
    log("cg-client", "Invalid supported coins response schema:", {
      errors: result.error.issues,
    });
    throw new Error(
      `[GC API] Supported coins schema validation failed: ${result.error.issues
        .map(e => `${e.path.join(".")}: ${e.message}`)
        .join(", ")}`,
    );
  }

  return result.data;
}

function transformSupportedCounterCurrenciesResponse(response: unknown): string[] {
  const result = SupportedCounterCurrenciesSchema.safeParse(response);

  if (!result.success) {
    log("cg-client", "Invalid supported counter currencies response schema:", {
      errors: result.error.issues,
    });
    throw new Error(
      `[GC API] Counter currencies schema validation failed: ${result.error.issues
        .map(e => `${e.path.join(".")}: ${e.message}`)
        .join(", ")}`,
    );
  }

  return result.data;
}

export const cgApi = createApi({
  reducerPath: "cgApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getEnv("COINGECKO_API_URL"),
  }),
  tagTypes: [GcDataTags.Coins, GcDataTags.CounterCurrencies],
  endpoints: build => ({
    getSupportedCoinsList: build.query<SupportedCoins, void>({
      query: () => "/coins/list",
      providesTags: [GcDataTags.Coins],
      keepUnusedDataFor: 24 * 60 * 60, // 1 day in seconds
      transformResponse: transformSupportedCoinsResponse,
    }),
    getSupportedCounterCurrencies: build.query<string[], void>({
      query: () => "/simple/supported_vs_currencies",
      providesTags: [GcDataTags.CounterCurrencies],
      keepUnusedDataFor: 24 * 60 * 60, // 1 day in seconds
      transformResponse: transformSupportedCounterCurrenciesResponse,
    }),
  }),
});

export const { useGetSupportedCoinsListQuery, useGetSupportedCounterCurrenciesQuery } = cgApi;
