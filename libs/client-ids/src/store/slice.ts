import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DeviceId, UserId, DatadogId } from "../ids";
import { initialIdentitiesState } from "./types";
import { PersistedIdentities } from "./persistence";
import { v4 as uuid } from "uuid";

/**
 * Redux slice for identities management
 */
export const identitiesSlice = createSlice({
  name: "identities",
  initialState: initialIdentitiesState,
  reducers: {
    /**
     * Initialize identities from persisted data
     */
    initFromPersisted: (state, action: PayloadAction<PersistedIdentities>) => {
      if (action.payload.userId) {
        state.userId = UserId.fromString(action.payload.userId);
      }
      if (action.payload.datadogId) {
        state.datadogId = DatadogId.fromString(action.payload.datadogId);
      }
      state.deviceIds = action.payload.deviceIds.map(DeviceId.fromString);
      state.pushDevicesSyncState = action.payload.pushDevicesSyncState;
      state.pushDevicesServiceUrl = action.payload.pushDevicesServiceUrl ?? null;
    },

    /**
     * Import from legacy system (localStorage/user storage)
     */
    importFromLegacy: (state, action: PayloadAction<{ userId: string; datadogId?: string }>) => {
      state.userId = UserId.fromString(action.payload.userId);
      if (action.payload.datadogId) {
        state.datadogId = DatadogId.fromString(action.payload.datadogId);
      } else {
        // Generate datadogId if not provided in legacy data
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
