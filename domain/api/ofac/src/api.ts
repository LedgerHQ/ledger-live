import type { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { countervaluesApi } from "@shared/api-services";

/** Statuses the OFAC check treats as a settled answer rather than a transport failure. */
const OFAC_ACCEPTED_STATUSES = new Set([200, 451]);

/** The legacy check never retried; override the shared Countervalues `retry(3)`. */
const noRetryOptions = { maxRetries: 0 };

/**
 * OFAC geo-block endpoint, injected into the shared Countervalues Service api.
 *
 * `injectEndpoints` mutates and returns that same api object, so this reference shares its reducer,
 * middleware and cache with every other CVS use case, while only this one is typed with the endpoint
 * below. There is no second `createApi` and no second reducer path.
 */
export const ofacApi = countervaluesApi.injectEndpoints({
  endpoints: build => ({
    check: build.query<boolean, void>({
      query: () => ({
        url: "/v3/markets",
        validateStatus: response => OFAC_ACCEPTED_STATUSES.has(response.status),
      }),
      transformResponse: (_response: unknown, meta: FetchBaseQueryMeta | undefined) =>
        meta?.response?.status === 451,
      extraOptions: noRetryOptions,
    }),
  }),
});

export const { useCheckQuery } = ofacApi;

export type OfacApi = typeof ofacApi;
