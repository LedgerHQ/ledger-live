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

    it("should initialize userId from persisted data", () => {
      const persisted: PersistedIdentities = {
        userId: "user-123",
        deviceIds: ["device-1"],
        pushDevicesSyncState: "unsynced",
        pushDevicesServiceUrl: null,
      };
      const action = identitiesSlice.actions.initFromPersisted(persisted);
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId.exportUserIdForPersistence()).toBe("user-123");
    });

    it("should initialize datadogId from persisted data", () => {
      const persisted: PersistedIdentities = {
        datadogId: "datadog-456",
        deviceIds: ["device-1"],
        pushDevicesSyncState: "unsynced",
        pushDevicesServiceUrl: null,
      };
      const action = identitiesSlice.actions.initFromPersisted(persisted);
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.datadogId.exportDatadogIdForPersistence()).toBe("datadog-456");
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

  describe("importFromLegacy", () => {
    it("should import userId from legacy system", () => {
      const action = identitiesSlice.actions.importFromLegacy({ userId: "legacy-user-123" });
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId.exportUserIdForPersistence()).toBe("legacy-user-123");
    });

    it("should import userId and datadogId from legacy system", () => {
      const action = identitiesSlice.actions.importFromLegacy({
        userId: "legacy-user-123",
        datadogId: "legacy-datadog-456",
      });
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId.exportUserIdForPersistence()).toBe("legacy-user-123");
      expect(state.datadogId.exportDatadogIdForPersistence()).toBe("legacy-datadog-456");
    });

    it("should generate datadogId if not provided in legacy data", () => {
      const action = identitiesSlice.actions.importFromLegacy({ userId: "legacy-user-123" });
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId.exportUserIdForPersistence()).toBe("legacy-user-123");
      // datadogId should be generated (UUID format)
      expect(state.datadogId.exportDatadogIdForPersistence()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe("initFromScratch", () => {
    it("should generate new userId and datadogId", () => {
      const action = identitiesSlice.actions.initFromScratch();
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      // Both should be generated (UUID format)
      expect(state.userId.exportUserIdForPersistence()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(state.datadogId.exportDatadogIdForPersistence()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      // Should be different from dummy IDs
      expect(state.userId.exportUserIdForPersistence()).not.toBe(
        initialIdentitiesState.userId.exportUserIdForPersistence(),
      );
      expect(state.datadogId.exportDatadogIdForPersistence()).not.toBe(
        initialIdentitiesState.datadogId.exportDatadogIdForPersistence(),
      );
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
