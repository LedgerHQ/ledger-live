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
   */
  userId: UserId | null;

  /**
   * Datadog ID - generated independently.
   */
  datadogId: DatadogId | null;

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
 * Initial state for identities
 */
export const initialIdentitiesState: IdentitiesState = {
  userId: null,
  datadogId: null,
  deviceIds: [],
  pushDevicesSyncState: "synced",
};
