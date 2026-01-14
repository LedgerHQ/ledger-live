import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@ledgerhq/live-env";
import { DeviceId } from "../ids";

/**
 * Request payload for the PushDevices endpoint
 */
export interface PushDevicesRequest {
  equipment_id: string;
  devices: string[];
}

/**
 * RTK Query API for Push Devices Service
 */
export const pushDevicesApi = createApi({
  reducerPath: "pushDevicesApi",
  baseQuery: retry(
    fetchBaseQuery({
      baseUrl: "",
      prepareHeaders: (headers: Headers) => {
        headers.set("Content-Type", "application/json");
        headers.set("X-Ledger-Client-Version", getEnv("LEDGER_CLIENT_VERSION"));
        return headers;
      },
    }),
    {
      maxRetries: 3,
    },
  ),
  tagTypes: [],
  endpoints: build => ({
    /**
     * Push devices to the backend service
     * This endpoint updates the backend with the current list of device IDs for a user
     * Success is determined by HTTP response code (2xx), no response body is expected
     */
    pushDevices: build.mutation<void, PushDevicesRequest>({
      query: body => {
        const baseUrl = getEnv("PUSH_DEVICES_SERVICE_URL");
        return {
          url: `${baseUrl}/pushdevices`,
          method: "POST",
          body,
        };
      },
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
  const equipment_id = userId;
  const devices = deviceIds.map(deviceId => deviceId.exportDeviceIdForPushDevicesService());

  return {
    equipment_id,
    devices,
  };
}

// Note: usePushDevicesMutation hook is not exported as it requires react-redux
// Use pushDevicesApi.endpoints.pushDevices.initiate() directly in middleware instead

export type PushDevicesApi = typeof pushDevicesApi;
