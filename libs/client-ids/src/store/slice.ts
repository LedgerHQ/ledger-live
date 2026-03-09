import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DeviceId, UserId, DatadogId } from "../ids";
import { initialIdentitiesState, DUMMY_ID_STR } from "./types";
import { PersistedIdentities } from "./persistence";
import { v4 as uuid } from "uuid";

function shouldUsePersistedId(value: string | undefined): value is string {
  return typeof value === "string" && value.trim() !== "" && value !== DUMMY_ID_STR;
}

/**
 * Redux slice for identities management
 */
export const identitiesSlice = createSlice({
  name: "identities",
  initialState: initialIdentitiesState,
  reducers: {
    /**
     * Initialize identities from persisted data.
     * If userId/datadogId is falsy, empty, or the dummy value, a new id is generated; otherwise the value is preserved.
     * When a new userId is generated, pushDevicesSyncState is forced to "unsynced" so the backend is updated with the new equipment_id.
     */
    initFromPersisted: (state, action: PayloadAction<PersistedIdentities>) => {
      const userIdRaw = action.payload.userId;
      const usePersistedUserId = shouldUsePersistedId(userIdRaw);
      state.userId = usePersistedUserId ? UserId.fromString(userIdRaw) : UserId.fromString(uuid());
      const datadogIdRaw = action.payload.datadogId;
      state.datadogId = shouldUsePersistedId(datadogIdRaw)
        ? DatadogId.fromString(datadogIdRaw)
        : DatadogId.fromString(uuid());
      state.deviceIds = action.payload.deviceIds.map(DeviceId.fromString);
      state.pushDevicesSyncState = usePersistedUserId
        ? action.payload.pushDevicesSyncState
        : "unsynced";
      state.pushDevicesServiceUrl = action.payload.pushDevicesServiceUrl ?? null;
    },

    /**
     * Import from legacy system (e.g. app/user in storage)
     */
    importFromLegacy: (state, action: PayloadAction<{ userId: string; datadogId?: string }>) => {
      state.userId = UserId.fromString(action.payload.userId);
      if (action.payload.datadogId) {
        state.datadogId = DatadogId.fromString(action.payload.datadogId);
      } else {
        state.datadogId = DatadogId.fromString(uuid());
      }
    },

    /**
     * Initialize from scratch (generate new userId and datadogId)
     */
    initFromScratch: state => {
      state.userId = UserId.fromString(uuid());
      state.datadogId = DatadogId.fromString(uuid());
    },

    /**
     * Add a new device ID
     */
    addDeviceId: (state, action: PayloadAction<DeviceId>) => {
      const newDeviceId = action.payload;
      let exists = false;
      for (const deviceId of state.deviceIds) {
        if (deviceId.equals(newDeviceId)) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        state.deviceIds.push(newDeviceId);
        state.pushDevicesSyncState = "unsynced";
      }
    },

    /**
     * Mark sync as completed
     * @param action.payload - The API endpoint URL that was used for this sync
     */
    markSyncCompleted: (state, action: PayloadAction<string>) => {
      state.pushDevicesSyncState = "synced";
      state.pushDevicesServiceUrl = action.payload;
    },
  },
});
