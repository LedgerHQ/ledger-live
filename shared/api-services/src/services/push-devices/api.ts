import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import {
  HEADER_X_LEDGER_CLIENT_VERSION,
  MAX_RETRIES,
  PUSH_DEVICES_REDUCER_PATH,
} from "./constants";
import { PushDevicesApiExtraSchema } from "./schema";
import type { PushDevicesApiExtra } from "./types";

/** Builds this service's slice of the thunk `extraArgument`. */
export function pushDevicesApiExtra(config: PushDevicesApiExtra): PushDevicesApiExtra {
  return PushDevicesApiExtraSchema.parse(config);
}

/**
 * Reads the injected {@link PushDevicesApiExtra} and delegates to {@link fetchBaseQuery}. Both
 * misconfiguration branches use `retry.fail` so a bad store aborts immediately instead of retrying.
 */
const pushDevicesBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = retry(
  (args, api, extraOptions) => {
    const parsed = PushDevicesApiExtraSchema.safeParse(api.extra);
    if (!parsed.success) {
      return retry.fail({
        status: "CUSTOM_ERROR" as const,
        error: "pushDevicesApiExtra not configured in store extraArgument",
      });
    }
    const extra = parsed.data;
    if (!extra.pushDevicesServiceUrl) {
      return retry.fail({
        status: "CUSTOM_ERROR" as const,
        error: "pushDevicesServiceUrl is empty — sync is disabled",
      });
    }
    const bq = fetchBaseQuery({
      baseUrl: extra.pushDevicesServiceUrl,
      prepareHeaders: headers => {
        headers.set("Content-Type", "application/json");
        headers.set(HEADER_X_LEDGER_CLIENT_VERSION, extra.ledgerClientVersion);
        return headers;
      },
    });
    return bq(args, api, extraOptions);
  },
  { maxRetries: MAX_RETRIES },
);

/**
 * Endpoint-less Push Devices Service api. Register it in the store; use cases add endpoints and tags
 * to this same object — see {@link https://github.com/LedgerHQ/ledger-live/blob/develop/shared/api-services/README.md}.
 */
export const pushDevicesApi = createApi({
  reducerPath: PUSH_DEVICES_REDUCER_PATH,
  baseQuery: pushDevicesBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type PushDevicesApi = typeof pushDevicesApi;
