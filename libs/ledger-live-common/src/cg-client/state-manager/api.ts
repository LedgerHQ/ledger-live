import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@shared/env";
import { log } from "@ledgerhq/logs";
import { GcDataTags, SupportedCounterCurrenciesSchema } from "./types";

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
  tagTypes: [GcDataTags.CounterCurrencies],
  endpoints: build => ({
    getSupportedCounterCurrencies: build.query<string[], void>({
      query: () => "/simple/supported_vs_currencies",
      providesTags: [GcDataTags.CounterCurrencies],
      keepUnusedDataFor: 24 * 60 * 60, // 1 day in seconds
      transformResponse: transformSupportedCounterCurrenciesResponse,
    }),
  }),
});

export const { useGetSupportedCounterCurrenciesQuery } = cgApi;
