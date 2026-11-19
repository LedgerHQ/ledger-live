import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query/react";
import { z } from "zod";
import { EARN_REDUCER_PATH, EARN_REQUEST_TIMEOUT_MS, MAX_RETRIES } from "./constants";
import { shouldRetryEarnRequest } from "./retry";
import { EarnApiExtraSchema } from "./schema";
import type { EarnApiExtra, EarnFetchArgs } from "./types";

/** Builds this service's slice of the thunk `extraArgument`. */
export function earnApiExtra(config: EarnApiExtra): EarnApiExtra {
  return EarnApiExtraSchema.parse(config);
}

const HttpBaseUrlSchema = z.url({ protocol: /^https?$/ });

/**
 * Reads the injected {@link EarnApiExtra} and delegates to {@link fetchBaseQuery}, aborting each
 * attempt after its `timeoutMs`. Not the `timeout` option of `fetchBaseQuery`: its timer is never
 * cleared, and React Native reports its abort as a `FETCH_ERROR`, which would then be retried.
 * Every misconfiguration branch uses `retry.fail`, so a bad store aborts at once instead of retrying.
 */
const timedEarnFetch: BaseQueryFn<
  string | EarnFetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  const configuredExtra = EarnApiExtraSchema.safeParse(api.extra);
  if (!configuredExtra.success) {
    return retry.fail({
      status: "CUSTOM_ERROR" as const,
      error: "earnApiExtra not configured in store extraArgument",
    });
  }
  const { earnApiBaseUrl } = configuredExtra.data;
  if (!earnApiBaseUrl) {
    return retry.fail({
      status: "CUSTOM_ERROR" as const,
      error: "earnApiBaseUrl is empty: the Earn service is disabled",
    });
  }
  // A base URL that is not absolute would send the request to the app's own origin, or make
  // `fetchBaseQuery` throw instead of returning an error.
  if (!HttpBaseUrlSchema.safeParse(earnApiBaseUrl).success) {
    return retry.fail({
      status: "CUSTOM_ERROR" as const,
      error: "earnApiBaseUrl is not an http(s) URL: the Earn service is disabled",
    });
  }

  const request: EarnFetchArgs = typeof args === "string" ? { url: args } : args;
  const { timeoutMs = EARN_REQUEST_TIMEOUT_MS, ...fetchArgs } = request;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const abort = () => controller.abort();
  if (api.signal.aborted) abort();
  api.signal.addEventListener("abort", abort);

  try {
    // No `prepareHeaders`: `fetchBaseQuery` sets the JSON content type only on a request with a
    // JSON body, so a GET goes out without one and a browser sends it without a CORS preflight.
    const result = await fetchBaseQuery({ baseUrl: earnApiBaseUrl })(
      fetchArgs,
      { ...api, signal: controller.signal },
      extraOptions,
    );

    if (timedOut && result.error) {
      return {
        ...result,
        error: { status: "TIMEOUT_ERROR", error: `Timed out after ${timeoutMs} ms` },
      };
    }
    return result;
  } finally {
    clearTimeout(timer);
    api.signal.removeEventListener("abort", abort);
  }
};

// `retryCondition` and `maxRetries` exclude each other in RTK: the condition also bounds the attempts.
const earnBaseQuery = retry(timedEarnFetch, {
  retryCondition: (error, _args, { attempt, baseQueryApi }) =>
    attempt <= MAX_RETRIES &&
    shouldRetryEarnRequest(error as FetchBaseQueryError, baseQueryApi.type),
});

/**
 * Endpoint-less Earn backend api. Register it in the store; use cases add endpoints and tags to
 * this same object, see {@link https://github.com/LedgerHQ/ledger-live/blob/develop/shared/api-services/README.md}.
 */
export const earnApi = createApi({
  reducerPath: EARN_REDUCER_PATH,
  baseQuery: earnBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type EarnApi = typeof earnApi;
