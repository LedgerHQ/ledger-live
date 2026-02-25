import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DeviceId } from "../ids";
import { initialIdentitiesState } from "./types";
import { PersistedIdentities } from "./persistence";

/**
 * Redux slice for identities management
 * Only manages DeviceIds - UserId and DatadogId are managed by apps
 */
export const identitiesSlice = createSlice({
  name: "identities",
  initialState: initialIdentitiesState,
  reducers: {
    /**
     * Initialize identities from persisted data
     */
    initFromPersisted: (state, action: PayloadAction<PersistedIdentities>) => {
      state.deviceIds = action.payload.deviceIds.map(DeviceId.fromString);
      state.pushDevicesSyncState = action.payload.pushDevicesSyncState;
      state.pushDevicesServiceUrl = action.payload.pushDevicesServiceUrl ?? null;
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
