import type { DeviceId } from "@domain/entity-client-identity";
import {
  pushDevicesApi,
  pushDevicesApiExtra,
  type PushDevicesApiExtra,
} from "@shared/api-services";

export { pushDevicesApiExtra };
export type { PushDevicesApiExtra };

/**
 * Request payload for the PushDevices endpoint
 */
export interface PushDevicesRequest {
  equipment_id: string;
  devices: string[];
}

/**
 * Device-sync endpoint, injected into the shared Push Devices service api. `injectEndpoints` returns
 * that same api object, so this reference shares its reducer, middleware and cache with every other
 * Push Devices use case — but only this one is typed with the endpoint below.
 */
export const pushDevicesSyncApi = pushDevicesApi.injectEndpoints({
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

export type PushDevicesSyncApi = typeof pushDevicesSyncApi;
