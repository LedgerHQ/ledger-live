import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { z } from "zod";
import type { DeviceId } from "@domain/entity-client-identity";
import { PushDevicesApiExtraSchema } from "./schema";

/**
 * Request payload for the PushDevices endpoint
 */
export interface PushDevicesRequest {
  equipment_id: string;
  devices: string[];
}

/**
 * Slice of the Redux thunk extraArgument for this package.
 * Pass to the store's extraArgument via `pushDevicesApiExtra({ ... })`.
 */
export type PushDevicesApiExtra = z.infer<typeof PushDevicesApiExtraSchema>;

/**
 * Builds this package's slice of the thunk extraArgument.
 * An empty pushDevicesServiceUrl disables sync (middleware checks for it).
 */
export function pushDevicesApiExtra(config: PushDevicesApiExtra): PushDevicesApiExtra {
  return PushDevicesApiExtraSchema.parse(config);
}

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
  { maxRetries: 3 },
);

/**
 * RTK Query API for Push Devices Service
 */
export const pushDevicesApi = createApi({
  reducerPath: "pushDevicesApi",
  baseQuery: pushDevicesBaseQuery,
  tagTypes: [],
  endpoints: build => ({
    /**
     * Push devices to the backend service
     * This endpoint updates the backend with the current list of device IDs for a user
     * Success is determined by HTTP response code (2xx), no response body is expected
     */
    pushDevices: build.mutation<void, PushDevicesRequest>({
      query: body => ({
        url: "/v2/pushdevices",
        method: "POST",
        body,
      }),
    }),
  }),
});

/**
 * Create a push devices request
 * @param userId - User ID (equipment_id) as string (managed by apps)
 * @param deviceIds - Array of DeviceId objects
 */
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
