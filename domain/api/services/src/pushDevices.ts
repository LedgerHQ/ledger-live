// Push Devices service: base query and the endpoint-less api its use cases inject into.

import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { z } from "zod";

/**
 * Thunk `extraArgument` contract for every Push-Devices-backed api. An empty
 * `pushDevicesServiceUrl` disables sync — the base query soft-fails rather than throwing, so the app
 * can boot without the service configured.
 */
export const PushDevicesApiExtraSchema = z.object({
  pushDevicesServiceUrl: z.string().trim(),
  ledgerClientVersion: z.string().trim().min(1),
});

/** Slice of the Redux thunk `extraArgument` owned by the Push Devices service. */
export type PushDevicesApiExtra = z.infer<typeof PushDevicesApiExtraSchema>;

/** Max retries for transient Push Devices request failures. */
const MAX_RETRIES = 3;

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
        headers.set("X-Ledger-Client-Version", extra.ledgerClientVersion);
        return headers;
      },
    });
    return bq(args, api, extraOptions);
  },
  { maxRetries: MAX_RETRIES },
);

/**
 * The Push Devices service api: owns the base URL and the reducer path, but no endpoints. Use-case
 * packages call `injectEndpoints` on it — which mutates and returns this same object, so cache,
 * reducer and middleware stay unified across them.
 *
 * Register this in the store; never call endpoints on it. Only the injected reference returned by
 * a use-case package carries the endpoint types.
 */
export const pushDevicesApi = createApi({
  reducerPath: "pushDevicesApi",
  baseQuery: pushDevicesBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type PushDevicesApi = typeof pushDevicesApi;
