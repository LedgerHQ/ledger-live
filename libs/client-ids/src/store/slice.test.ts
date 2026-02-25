import { identitiesSlice } from "./slice";
import { initialIdentitiesState } from "./types";
import { DeviceId } from "../ids";
import { PersistedIdentities } from "./persistence";
import * as storeIndex from "./index";

describe("store/index exports", () => {
  it("should export all store modules", () => {
    expect(storeIndex.identitiesSlice).toBeDefined();
    expect(storeIndex.createIdentitiesSyncMiddleware).toBeDefined();
    expect(storeIndex.initialIdentitiesState).toBeDefined();
  });
});

describe("identitiesSlice", () => {
  describe("initFromPersisted", () => {
    it("should initialize identities from persisted data", () => {
      const persisted: PersistedIdentities = {
        deviceIds: ["device-1", "device-2"],
        pushDevicesSyncState: "unsynced",
        pushDevicesServiceUrl: "https://api.example.com",
      };
      const action = identitiesSlice.actions.initFromPersisted(persisted);
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.deviceIds).toHaveLength(2);
      expect(state.deviceIds[0]).toBeInstanceOf(DeviceId);
      expect(state.deviceIds[1]).toBeInstanceOf(DeviceId);
      expect(state.pushDevicesSyncState).toBe("unsynced");
      expect(state.pushDevicesServiceUrl).toBe("https://api.example.com");
    });

    it("should handle missing pushDevicesServiceUrl (backward compatibility)", () => {
      const persisted: PersistedIdentities = {
        deviceIds: ["device-1"],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: null,
      };
      const action = identitiesSlice.actions.initFromPersisted(persisted);
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.pushDevicesServiceUrl).toBeNull();
    });
  });

  describe("addDeviceId", () => {
    it("should add a new device ID", () => {
      const deviceId = new DeviceId("device-123");
      const action = identitiesSlice.actions.addDeviceId(deviceId);
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.deviceIds).toHaveLength(1);
      expect(state.deviceIds[0].equals(deviceId)).toBe(true);
      expect(state.pushDevicesSyncState).toBe("unsynced");
    });

    it("should not add duplicate device ID", () => {
      const deviceId = new DeviceId("device-123");
      const state1 = identitiesSlice.reducer(
        initialIdentitiesState,
        identitiesSlice.actions.addDeviceId(deviceId),
      );
      const state2 = identitiesSlice.reducer(state1, identitiesSlice.actions.addDeviceId(deviceId));

      expect(state2.deviceIds).toHaveLength(1);
    });
  });

  describe("markSyncCompleted", () => {
    it("should mark sync as completed and save the endpoint URL", () => {
      const deviceId = new DeviceId("device-123");
      let state = identitiesSlice.reducer(
        initialIdentitiesState,
        identitiesSlice.actions.addDeviceId(deviceId),
      );
      expect(state.pushDevicesSyncState).toBe("unsynced");
      expect(state.pushDevicesServiceUrl).toBeNull();

      const endpointUrl = "https://api.example.com";
      state = identitiesSlice.reducer(
        state,
        identitiesSlice.actions.markSyncCompleted(endpointUrl),
      );
      expect(state.pushDevicesSyncState).toBe("synced");
      expect(state.pushDevicesServiceUrl).toBe(endpointUrl);
    });
  });

  describe("JSON.stringify security", () => {
    it("should not expose device IDs in plain text when stringifying the store", () => {
      const deviceId1 = new DeviceId("sensitive-device-id-123");
      const deviceId2 = new DeviceId("another-sensitive-id-456");
      let state = identitiesSlice.reducer(
        initialIdentitiesState,
        identitiesSlice.actions.addDeviceId(deviceId1),
      );
      state = identitiesSlice.reducer(state, identitiesSlice.actions.addDeviceId(deviceId2));

      const jsonString = JSON.stringify(state);

      // Device IDs should be redacted
      expect(jsonString).toContain("[DeviceId:REDACTED]");
      // Actual device ID values should NOT be in the JSON
      expect(jsonString).not.toContain("sensitive-device-id-123");
      expect(jsonString).not.toContain("another-sensitive-id-456");
    });
  });
});
