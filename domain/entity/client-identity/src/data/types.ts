import { DeviceId, UserId, DatadogId } from "../ids";

export type { UserId } from "../ids";

export type PushDevicesSyncState = "synced" | "unsynced";

/** String value used for dummy userId/datadogId (persisted form) */
export const DUMMY_ID_STR = "00000000-0000-0000-0000-000000000000";

export const DUMMY_USER_ID = UserId.fromString(DUMMY_ID_STR);

export const DUMMY_DATADOG_ID = DatadogId.fromString(DUMMY_ID_STR);

export interface IdentitiesState {
  userId: UserId;
  datadogId: DatadogId;
  deviceIds: DeviceId[];
  pushDevicesSyncState: PushDevicesSyncState;
  pushDevicesServiceUrl: string | null;
}

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
