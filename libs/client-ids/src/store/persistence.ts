import { IdentitiesState } from "./types";

/**
 * Serialized format for persistence
 * Only DeviceIds are persisted - UserId and DatadogId are managed by apps
 */
export interface PersistedIdentities {
  deviceIds: string[];
  pushDevicesSyncState: "synced" | "unsynced";
  pushDevicesServiceUrl: string | null;
}

export function exportIdentitiesForPersistence(state: IdentitiesState): PersistedIdentities {
  const deviceIds = state.deviceIds.map(deviceId => deviceId.exportDeviceIdForPersistence());
  const pushDevicesSyncState = state.pushDevicesSyncState;
  const pushDevicesServiceUrl = state.pushDevicesServiceUrl;

  return { deviceIds, pushDevicesSyncState, pushDevicesServiceUrl };
}
