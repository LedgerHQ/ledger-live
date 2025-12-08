import { identitiesSlice } from "./slice";
import { initialIdentitiesState } from "./types";
import { DeviceId, UserId, DatadogId } from "../ids";
import { PersistedIdentities } from "./persistence";

describe("identitiesSlice", () => {
  describe("initFromScratch", () => {
    it("should initialize state with generated user ID and datadog ID", () => {
      const action = identitiesSlice.actions.initFromScratch();
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId).toBeTruthy();
      expect(state.datadogId).toBeTruthy();
      expect(state.userId).toBeInstanceOf(UserId);
      expect(state.datadogId).toBeInstanceOf(DatadogId);
      expect(state.deviceIds).toEqual([]);
      expect(state.pushDevicesSyncState).toBe("synced");
    });
  });

  describe("initFromPersisted", () => {
    it("should initialize identities from persisted data", () => {
      const persisted: PersistedIdentities = {
        userId: "user-123",
        datadogId: "datadog-456",
        deviceIds: ["device-1", "device-2"],
        pushDevicesSyncState: "unsynced",
      };
      const action = identitiesSlice.actions.initFromPersisted(persisted);
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId).toBeInstanceOf(UserId);
      expect(state.datadogId).toBeInstanceOf(DatadogId);
      expect(state.deviceIds).toHaveLength(2);
      expect(state.deviceIds[0]).toBeInstanceOf(DeviceId);
      expect(state.deviceIds[1]).toBeInstanceOf(DeviceId);
      expect(state.pushDevicesSyncState).toBe("unsynced");
    });
  });

  describe("importFromLegacy", () => {
    it("should import identities from legacy format with datadogId", () => {
      const action = identitiesSlice.actions.importFromLegacy({
        userId: "user-123",
        datadogId: "datadog-456",
      });
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId).toBeInstanceOf(UserId);
      expect(state.datadogId).toBeInstanceOf(DatadogId);
      expect(state.deviceIds).toEqual([]);
      expect(state.pushDevicesSyncState).toBe("synced");
    });

    it("should generate datadogId if missing", () => {
      const action = identitiesSlice.actions.importFromLegacy({
        userId: "user-123",
      });
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId).toBeInstanceOf(UserId);
      expect(state.datadogId).toBeTruthy();
      expect(state.datadogId).toBeInstanceOf(DatadogId);
      expect(state.deviceIds).toEqual([]);
      expect(state.pushDevicesSyncState).toBe("synced");
    });
  });

  describe("addDeviceId", () => {
    it("should add a new device ID", () => {
      const deviceId = new DeviceId("device-123");
      const action = identitiesSlice.actions.addDeviceId(deviceId);
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.deviceIds).toHaveLength(1);
      expect(state.deviceIds[0].equals(deviceId)).toBe(true);
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

  describe("JSON.stringify security", () => {
    it("should not expose device IDs in plain text when stringifying the store", () => {
      const deviceId1 = new DeviceId("sensitive-device-id-123");
      const deviceId2 = new DeviceId("another-sensitive-id-456");
      let state = identitiesSlice.reducer(
        initialIdentitiesState,
        identitiesSlice.actions.initFromScratch(),
      );
      state = identitiesSlice.reducer(state, identitiesSlice.actions.addDeviceId(deviceId1));
      state = identitiesSlice.reducer(state, identitiesSlice.actions.addDeviceId(deviceId2));

      const jsonString = JSON.stringify(state);

      // Device IDs should be redacted
      expect(jsonString).toContain("[DeviceId:REDACTED]");
      // User IDs and Datadog IDs should also be redacted
      expect(jsonString).toContain("[UserId:REDACTED]");
      expect(jsonString).toContain("[DatadogId:REDACTED]");
      // Actual device ID values should NOT be in the JSON
      expect(jsonString).not.toContain("sensitive-device-id-123");
      expect(jsonString).not.toContain("another-sensitive-id-456");
      // Other data should still be present
      expect(state.userId).toBeTruthy();
      expect(state.datadogId).toBeTruthy();
    });
  });
});
