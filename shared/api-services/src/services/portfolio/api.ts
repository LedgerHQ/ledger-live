import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query/react";
import { MAX_RETRIES, PORTFOLIO_REDUCER_PATH } from "./constants";
import { shouldRetry } from "./retry";
import { PortfolioApiExtraSchema } from "./schema";
import type { PortfolioApiExtra } from "./types";

/** Builds this service's slice of the thunk `extraArgument`. */
export function portfolioApiExtra(config: PortfolioApiExtra): PortfolioApiExtra {
  return PortfolioApiExtraSchema.parse(config);
}

/**
 * Reads the injected {@link PortfolioApiExtra} and delegates to {@link fetchBaseQuery}. Both
 * misconfiguration branches use `retry.fail` so a bad store aborts immediately instead of retrying.
 */
const portfolioFetch: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = (args, api, extraOptions) => {
  const parsed = PortfolioApiExtraSchema.safeParse(api.extra);
  if (!parsed.success) {
    return retry.fail({
      status: "CUSTOM_ERROR" as const,
      error: "portfolioApiExtra not configured in store extraArgument",
    });
  }
  const { portfolioServiceUrl } = parsed.data;
  if (!portfolioServiceUrl) {
    return retry.fail({
      status: "CUSTOM_ERROR" as const,
      error: "portfolioServiceUrl is empty — portfolio service is disabled",
    });
  }
  const bq = fetchBaseQuery({
    baseUrl: portfolioServiceUrl,
    prepareHeaders: headers => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  });
  return bq(args, api, extraOptions);
};

// `retryCondition` and `maxRetries` exclude each other in RTK: the condition also bounds the attempts.
const portfolioBaseQuery = retry(portfolioFetch, {
  retryCondition: (error, args, { attempt }) =>
    attempt <= MAX_RETRIES && shouldRetry(error as FetchBaseQueryError, args),
});

/**
 * Endpoint-less Portfolio Service api. Register it in the store; use cases add endpoints and tags
 * to this same object — see {@link https://github.com/LedgerHQ/ledger-live/blob/develop/shared/api-services/README.md}.
 */
export { PORTFOLIO_REDUCER_PATH };

export const portfolioApi = createApi({
  reducerPath: PORTFOLIO_REDUCER_PATH,
  baseQuery: portfolioBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type PortfolioApi = typeof portfolioApi;
