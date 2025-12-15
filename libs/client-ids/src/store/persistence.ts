import { IdentitiesState, isDummyUserId, isDummyDatadogId } from "./types";

/**
 * Serialized format for persistence
 */
export interface PersistedIdentities {
  userId: string | null;
  datadogId: string | null;
  deviceIds: string[];
  pushDevicesSyncState: "synced" | "unsynced";
  pushDevicesServiceUrl: string | null;
}

export function exportIdentitiesForPersistence(state: IdentitiesState): PersistedIdentities {
  const userId = !isDummyUserId(state.userId) ? state.userId.exportUserIdForPersistence() : null;
  const datadogId = !isDummyDatadogId(state.datadogId)
    ? state.datadogId.exportDatadogIdForPersistence()
    : null;
  const deviceIds = state.deviceIds.map(deviceId => deviceId.exportDeviceIdForPersistence());
  const pushDevicesSyncState = state.pushDevicesSyncState;
  const pushDevicesServiceUrl = state.pushDevicesServiceUrl;

  return { userId, datadogId, deviceIds, pushDevicesSyncState, pushDevicesServiceUrl };
}
