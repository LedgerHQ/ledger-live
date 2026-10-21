import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import {
  CAL_REDUCER_PATH,
  CAL_REQUEST_TIMEOUT_MS,
  HEADER_X_LEDGER_CLIENT_VERSION,
  MAX_RETRIES,
} from "./constants";
import { CalApiExtraSchema } from "./schema";
import type { CalApiExtra } from "./types";

/**
 * Builds this service's slice of the thunk `extraArgument`. RTK leaves `extraArgument` untyped, so
 * this is the one compile- and runtime-checked entry point: `parse` fails fast at app init if the CAL
 * config is incomplete (e.g. an env var resolved to an empty string).
 */
export function calApiExtra(extra: CalApiExtra): CalApiExtra {
  return CalApiExtraSchema.parse(extra);
}

/**
 * Extracts the {@link CalApiExtra} from the `extraArgument` of the api. Exported because endpoints
 * that bypass the base query — e.g. a `queryFn` issuing its own `fetch` — still need the config.
 */
export function getCalExtra(api: { extra: unknown }): CalApiExtra {
  return api.extra as CalApiExtra;
}

/**
 * Only a network error or a 5xx can pass on a second try. A timeout is not retried, so a hung CAL
 * holds its caller for one {@link CAL_REQUEST_TIMEOUT_MS} only.
 */
function isRetryable(error: FetchBaseQueryError): boolean {
  if (error.status === "FETCH_ERROR") return true;
  return typeof error.status === "number" && error.status >= 500;
}

/**
 * Reads the injected {@link CalApiExtra} and delegates to {@link fetchBaseQuery}, aborting the request
 * after {@link CAL_REQUEST_TIMEOUT_MS} or the request's own `timeout`. `fetchBaseQuery`'s `timeout`
 * option never clears its timer, which keeps a Node process alive after every request; this one does.
 */
const timedFetchBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const extra = getCalExtra(api);
  const { timeout = CAL_REQUEST_TIMEOUT_MS, ...fetchArgs } =
    typeof args === "string" ? { url: args } : args;

  const controller = new AbortController();
  const forwardAbort = () => controller.abort(api.signal.reason);
  if (api.signal.aborted) forwardAbort();
  else api.signal.addEventListener("abort", forwardAbort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeout);

  try {
    const result = await fetchBaseQuery({
      baseUrl: extra.calServiceUrl,
      prepareHeaders: headers => {
        headers.set("Content-Type", "application/json");
        headers.set(HEADER_X_LEDGER_CLIENT_VERSION, extra.ledgerClientVersion);
        return headers;
      },
    })(fetchArgs, { ...api, signal: controller.signal }, extraOptions);
    // Our abort reaches fetchBaseQuery as a FETCH_ERROR; callers must still see a timeout.
    if (timedOut && result.error) {
      return {
        error: { status: "TIMEOUT_ERROR", error: `CAL request timed out after ${timeout}ms` },
        meta: result.meta,
      };
    }
    return result;
  } finally {
    clearTimeout(timer);
    api.signal.removeEventListener("abort", forwardAbort);
  }
};

/** {@link timedFetchBaseQuery}, wrapped in `retry`. */
const calBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = retry(
  timedFetchBaseQuery,
  {
    // An endpoint can still set the count with `extraOptions: { maxRetries }`. RTK types
    // `extraOptions` as always set, but it is undefined on an endpoint that declares none.
    retryCondition: (error, _args, { attempt, extraOptions }) =>
      attempt <= (extraOptions?.maxRetries ?? MAX_RETRIES) &&
      isRetryable(error as FetchBaseQueryError),
  },
);

/**
 * Endpoint-less CAL api. Register it in the store; use cases add endpoints and tags to this same
 * object — see {@link https://github.com/LedgerHQ/ledger-live/blob/develop/shared/api-services/README.md}.
 */
export const calApi = createApi({
  reducerPath: CAL_REDUCER_PATH,
  baseQuery: calBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type CalApi = typeof calApi;
