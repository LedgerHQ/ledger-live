import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
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
 * Reads the injected {@link CalApiExtra} and delegates to {@link fetchBaseQuery}, aborting the attempt
 * after {@link CAL_REQUEST_TIMEOUT_MS}. Not the `timeout` option of `fetchBaseQuery`: its timer is
 * never cleared, which keeps a Node process alive, and React Native reports its abort as a
 * `FETCH_ERROR`.
 */
const timedFetchBaseQuery: ReturnType<typeof fetchBaseQuery> = async (args, api, extraOptions) => {
  const extra = getCalExtra(api);
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, CAL_REQUEST_TIMEOUT_MS);
  const abort = () => controller.abort();
  api.signal.addEventListener("abort", abort);

  try {
    const result = await fetchBaseQuery({
      baseUrl: extra.calServiceUrl,
      prepareHeaders: headers => {
        headers.set("Content-Type", "application/json");
        headers.set(HEADER_X_LEDGER_CLIENT_VERSION, extra.ledgerClientVersion);
        return headers;
      },
    })(args, { ...api, signal: controller.signal }, extraOptions);

    if (timedOut && result.error) {
      return {
        ...result,
        error: { status: "TIMEOUT_ERROR", error: `Timed out after ${CAL_REQUEST_TIMEOUT_MS} ms` },
      };
    }
    return result;
  } finally {
    clearTimeout(timer);
    api.signal.removeEventListener("abort", abort);
  }
};

function isTimeoutError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === "TIMEOUT_ERROR"
  );
}

/** {@link timedFetchBaseQuery} wrapped in `retry`. A timed-out attempt is not retried. */
const calBaseQuery = retry(timedFetchBaseQuery, {
  retryCondition: (error, _args, { attempt }) => !isTimeoutError(error) && attempt <= MAX_RETRIES,
});

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
