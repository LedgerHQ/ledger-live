import { DeviceId } from "../ids";

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
 */
export const initialIdentitiesState: IdentitiesState = {
  deviceIds: [],
  pushDevicesSyncState: "synced",
  pushDevicesServiceUrl: null,
};
