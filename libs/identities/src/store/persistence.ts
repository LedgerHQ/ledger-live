import { IdentitiesState, isDummyUserId, isDummyDatadogId } from "./types";

/**
 * Serialized format for persistence
 * IDs are exported as strings for storage
 */
export interface PersistedIdentities {
  userId: string;
  datadogId: string;
  deviceIds: string[];
  pushDevicesSyncState: "synced" | "unsynced";
}

export function exportIdentitiesForPersistence(state: IdentitiesState): PersistedIdentities {
  if (isDummyUserId(state.userId) || isDummyDatadogId(state.datadogId)) {
    throw new Error("Cannot export identities: userId or datadogId is not initialized");
  }

  const userId = state.userId.exportUserIdForPersistence();
  const datadogId = state.datadogId.exportDatadogIdForPersistence();
  const deviceIds = state.deviceIds.map(deviceId => deviceId.exportDeviceIdForPersistence());
  const pushDevicesSyncState = state.pushDevicesSyncState;

  return { userId, datadogId, deviceIds, pushDevicesSyncState };
}
