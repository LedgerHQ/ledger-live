import { IdentitiesState, isDummyUserId, isDummyDatadogId, isDummyPortfolioId } from "./types";

/**
 * Serialized format for persistence
 */
export interface PersistedIdentities {
  userId?: string;
  datadogId?: string;
  portfolioId?: string;
  deviceIds: string[];
  pushDevicesSyncState: "synced" | "unsynced";
  pushDevicesServiceUrl: string | null;
}

export function exportIdentitiesForPersistence(state: IdentitiesState): PersistedIdentities {
  const deviceIds = state.deviceIds.map(deviceId => deviceId.exportDeviceIdForPersistence());
  const pushDevicesSyncState = state.pushDevicesSyncState;
  const pushDevicesServiceUrl = state.pushDevicesServiceUrl;
  const userId = isDummyUserId(state.userId)
    ? undefined
    : state.userId.exportUserIdForPersistence();
  const datadogId = isDummyDatadogId(state.datadogId)
    ? undefined
    : state.datadogId.exportDatadogIdForPersistence();
  const portfolioId = isDummyPortfolioId(state.portfolioId)
    ? undefined
    : state.portfolioId.exportPortfolioIdForPersistence();

  return { userId, datadogId, portfolioId, deviceIds, pushDevicesSyncState, pushDevicesServiceUrl };
}
