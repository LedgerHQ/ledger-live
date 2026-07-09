import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { DeviceId } from "@domain/entity-client-identity";
import { PushDevicesApiExtraSchema } from "./schema";

export interface PushDevicesRequest {
  equipment_id: string;
  devices: string[];
}

/**
 * Slice of the Redux thunk extraArgument for this package.
 * Pass to the store's extraArgument via `pushDevicesApiExtra({ ... })`.
 */
export type PushDevicesApiExtra = {
  pushDevicesServiceUrl: string;
  ledgerClientVersion: string;
};

/**
 * Builds this package's slice of the thunk extraArgument.
 * An empty pushDevicesServiceUrl disables sync (middleware checks for it).
 */
export function pushDevicesApiExtra(config: PushDevicesApiExtra): PushDevicesApiExtra {
  return PushDevicesApiExtraSchema.parse(config);
}

const _baseQueryCache = new WeakMap<PushDevicesApiExtra, ReturnType<typeof fetchBaseQuery>>();

const pushDevicesBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = retry(
  (args, api, extraOptions) => {
    const extra = api.extra as PushDevicesApiExtra | undefined;
    if (!extra?.ledgerClientVersion) {
      return retry.fail({
        status: "CUSTOM_ERROR" as const,
        error: "pushDevicesApiExtra not configured in store extraArgument",
      });
    }
    if (!extra.pushDevicesServiceUrl) {
      return retry.fail({
        status: "CUSTOM_ERROR" as const,
        error: "pushDevicesServiceUrl is empty — sync is disabled",
      });
    }
    let bq = _baseQueryCache.get(extra);
    if (!bq) {
      bq = fetchBaseQuery({
        baseUrl: extra.pushDevicesServiceUrl,
        prepareHeaders: headers => {
          headers.set("Content-Type", "application/json");
          headers.set("X-Ledger-Client-Version", extra.ledgerClientVersion);
          return headers;
        },
      });
      _baseQueryCache.set(extra, bq);
    }
    return bq(args, api, extraOptions);
  },
  { maxRetries: 3 },
);

export const pushDevicesApi = createApi({
  reducerPath: "pushDevicesApi",
  baseQuery: pushDevicesBaseQuery,
  tagTypes: [],
  endpoints: build => ({
    pushDevices: build.mutation<void, PushDevicesRequest>({
      query: body => ({
        url: "/v2/pushdevices",
        method: "POST",
        body,
      }),
    }),
  }),
});

export function createPushDevicesRequest(
  userId: string,
  deviceIds: DeviceId[],
): PushDevicesRequest {
  return {
    equipment_id: userId,
    devices: deviceIds.map(deviceId => deviceId.exportDeviceIdForPushDevicesService()),
  };
}

export type PushDevicesApi = typeof pushDevicesApi;
