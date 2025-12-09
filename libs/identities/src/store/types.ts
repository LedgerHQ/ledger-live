import { DeviceId, UserId, DatadogId } from "../ids";

/**
 * Sync state for push devices operation
 * "synced" = data is synchronized with backend
 * "unsynced" = data needs to be synchronized (store was modified or previous sync failed)
 */
export type PushDevicesSyncState = "synced" | "unsynced";

/**
 * Identities state managed by Redux
 */
export interface IdentitiesState {
  /**
   * User ID (equipment_id) - same as segment ID
   * Always defined, even if it's a dummy value before initialization
   */
  userId: UserId;

  /**
   * Datadog ID - generated independently.
   * Always defined, even if it's a dummy value before initialization
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
}

/**
 * Dummy IDs used before proper initialization
 * These are temporary placeholders that will be replaced during init
 */
const DUMMY_USER_ID = new UserId("00000000-0000-0000-0000-000000000000");
const DUMMY_DATADOG_ID = new DatadogId("00000000-0000-0000-0000-000000000000");

/**
 * Check if a userId is the dummy placeholder (not yet initialized)
 */
export function isDummyUserId(userId: UserId): boolean {
  return userId.equals(DUMMY_USER_ID);
}

/**
 * Check if a datadogId is the dummy placeholder (not yet initialized)
 */
export function isDummyDatadogId(datadogId: DatadogId): boolean {
  return datadogId.equals(DUMMY_DATADOG_ID);
}

/**
 * Initial state for identities
 * Uses dummy IDs that will be replaced during initialization
 */
export const initialIdentitiesState: IdentitiesState = {
  userId: DUMMY_USER_ID,
  datadogId: DUMMY_DATADOG_ID,
  deviceIds: [],
  pushDevicesSyncState: "synced",
};
