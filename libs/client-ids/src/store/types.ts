import { DeviceId, UserId, DatadogId } from "../ids";

/**
 * Sync state for push devices operation
 * "synced" = data is synchronized with backend
 * "unsynced" = data needs to be synchronized (store was modified or previous sync failed)
 */
export type PushDevicesSyncState = "synced" | "unsynced";

/**
 * Dummy userId used as placeholder before real userId is initialized
 * This ensures userIdSelector always returns a non-null value
 */
export const DUMMY_USER_ID = UserId.fromString("00000000-0000-0000-0000-000000000000");

/**
 * Dummy datadogId used as placeholder before real datadogId is initialized
 * This ensures datadogIdSelector always returns a non-null value
 */
export const DUMMY_DATADOG_ID = DatadogId.fromString("00000000-0000-0000-0000-000000000000");

/**
 * Identities state managed by Redux
 */
export interface IdentitiesState {
  /**
   * User ID (equipment_id) - always present (dummy object if not initialized)
   */
  userId: UserId;

  /**
   * Datadog ID - always present (dummy object if not initialized)
   */
  datadogId: DatadogId;

  /**
   * Array of device IDs
   */
  deviceIds: DeviceId[];

  /**
   * Sync state for push devices operation
   */
  pushDevicesSyncState: PushDevicesSyncState;

  /**
   * The API endpoint URL that was used for the last successful sync
   * If this changes, the state should be considered "unsynced"
   */
  pushDevicesServiceUrl: string | null;
}

/**
 * Initial state for identities
 * Uses dummy objects to ensure selectors always return non-null values
 */
export const initialIdentitiesState: IdentitiesState = {
  userId: DUMMY_USER_ID,
  datadogId: DUMMY_DATADOG_ID,
  deviceIds: [],
  pushDevicesSyncState: "synced",
  pushDevicesServiceUrl: null,
};

/**
 * Check if a userId is the dummy placeholder
 */
export function isDummyUserId(userId: UserId): boolean {
  return userId.equals(DUMMY_USER_ID);
}

/**
 * Check if a datadogId is the dummy placeholder
 */
export function isDummyDatadogId(datadogId: DatadogId): boolean {
  return datadogId.equals(DUMMY_DATADOG_ID);
}
