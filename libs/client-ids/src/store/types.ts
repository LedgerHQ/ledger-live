import { DeviceId, UserId, DatadogId } from "../ids";

/**
 * Sync state for push devices operation
 * "synced" = data is synchronized with backend
 * "unsynced" = data needs to be synchronized (store was modified or previous sync failed)
 */
export type PushDevicesSyncState = "synced" | "unsynced";

/** String value used for dummy userId/datadogId (persisted form) */
export const DUMMY_ID_STR = "00000000-0000-0000-0000-000000000000";

/**
 * Dummy userId used as placeholder before real userId is initialized
 */
export const DUMMY_USER_ID = UserId.fromString(DUMMY_ID_STR);

/**
 * Dummy datadogId used as placeholder before real datadogId is initialized
 */
export const DUMMY_DATADOG_ID = DatadogId.fromString(DUMMY_ID_STR);

/**
 * Identities state managed by Redux
 */
export interface IdentitiesState {
  userId: UserId;
  datadogId: DatadogId;
  deviceIds: DeviceId[];
  pushDevicesSyncState: PushDevicesSyncState;
  pushDevicesServiceUrl: string | null;
}

/**
 * Initial state for identities
 */
export const initialIdentitiesState: IdentitiesState = {
  userId: DUMMY_USER_ID,
  datadogId: DUMMY_DATADOG_ID,
  deviceIds: [],
  pushDevicesSyncState: "synced",
  pushDevicesServiceUrl: null,
};

export function isDummyUserId(userId: UserId): boolean {
  return userId.equals(DUMMY_USER_ID);
}

export function isDummyDatadogId(datadogId: DatadogId): boolean {
  return datadogId.equals(DUMMY_DATADOG_ID);
}
