import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";
import { DeviceId, UserId, DatadogId } from "../ids";
import { initialIdentitiesState } from "./types";
import { PersistedIdentities } from "./persistence";

/**
 * Redux slice for identities management
 */
export const identitiesSlice = createSlice({
  name: "identities",
  initialState: initialIdentitiesState,
  reducers: {
    /**
     * Initialize identities from scratch (generate new user ID and datadog ID)
     * This is used when creating a new user identity
     * No sync needed as there are no device IDs to push
     */
    initFromScratch: state => {
      state.userId = new UserId(uuid());
      state.datadogId = new DatadogId(uuid());
      state.deviceIds = [];
      state.pushDevicesSyncState = "synced";
    },

    /**
     * Initialize identities from persisted data
     */
    initFromPersisted: (state, action: PayloadAction<PersistedIdentities>) => {
      state.userId = UserId.fromString(action.payload.userId);
      state.datadogId = DatadogId.fromString(action.payload.datadogId);
      state.deviceIds = action.payload.deviceIds.map(DeviceId.fromString);
      state.pushDevicesSyncState = action.payload.pushDevicesSyncState;
    },

    /**
     * Import identities from legacy format (migration)
     * If datadogId is missing, generates a new one
     */
    importFromLegacy: (state, action: PayloadAction<{ userId: string; datadogId?: string }>) => {
      state.userId = new UserId(action.payload.userId);
      state.datadogId = action.payload.datadogId
        ? new DatadogId(action.payload.datadogId)
        : new DatadogId(uuid());
      state.deviceIds = [];
      state.pushDevicesSyncState = "synced";
    },

    /**
     * Add a new device ID
     */
    addDeviceId: (state, action: PayloadAction<DeviceId>) => {
      const newDeviceId = action.payload;
      let exists = false;
      for (let i = 0; i < state.deviceIds.length; i++) {
        if (state.deviceIds[i].equals(newDeviceId)) {
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
     */
    markSyncCompleted: state => {
      state.pushDevicesSyncState = "synced";
    },
  },
});
