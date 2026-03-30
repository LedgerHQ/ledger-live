import { identitiesSlice } from "./slice";
import { initialIdentitiesState, DUMMY_ID_STR } from "./types";
import { DeviceId, UserId, DatadogId } from "../ids";
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

    it("should restore userId and datadogId when present in persisted payload", () => {
      const persisted: PersistedIdentities = {
        userId: "user-persisted-123",
        datadogId: "dd-persisted-456",
        deviceIds: ["device-1"],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: null,
      };
      const action = identitiesSlice.actions.initFromPersisted(persisted);
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId).toBeInstanceOf(UserId);
      expect(state.userId.exportUserIdForPersistence()).toBe("user-persisted-123");
      expect(state.datadogId).toBeInstanceOf(DatadogId);
      expect(state.datadogId.exportDatadogIdForPersistence()).toBe("dd-persisted-456");
    });

    it("should restore userId and generate new datadogId when datadogId is missing in persisted payload", () => {
      const persisted: PersistedIdentities = {
        userId: "user-only-123",
        deviceIds: [],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: null,
      };
      const action = identitiesSlice.actions.initFromPersisted(persisted);
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId.exportUserIdForPersistence()).toBe("user-only-123");
      expect(state.datadogId).toBeInstanceOf(DatadogId);
      expect(state.datadogId.exportDatadogIdForPersistence()).not.toBe(
        initialIdentitiesState.datadogId.exportDatadogIdForPersistence(),
      );
    });

    it("should generate new userId and datadogId when both missing in persisted payload", () => {
      const persisted: PersistedIdentities = {
        deviceIds: [],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: null,
      };
      const action = identitiesSlice.actions.initFromPersisted(persisted);
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId.exportUserIdForPersistence()).not.toBe(
        initialIdentitiesState.userId.exportUserIdForPersistence(),
      );
      expect(state.datadogId.exportDatadogIdForPersistence()).not.toBe(
        initialIdentitiesState.datadogId.exportDatadogIdForPersistence(),
      );
    });

    it("should generate new userId and datadogId when both are dummy string in persisted payload", () => {
      const persisted: PersistedIdentities = {
        userId: DUMMY_ID_STR,
        datadogId: DUMMY_ID_STR,
        deviceIds: [],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: null,
      };
      const action = identitiesSlice.actions.initFromPersisted(persisted);
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId.exportUserIdForPersistence()).not.toBe(DUMMY_ID_STR);
      expect(state.datadogId.exportDatadogIdForPersistence()).not.toBe(DUMMY_ID_STR);
    });

    it("should generate new id when persisted value is empty or whitespace-only", () => {
      const persisted: PersistedIdentities = {
        userId: "  ",
        datadogId: "",
        deviceIds: [],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: null,
      };
      const action = identitiesSlice.actions.initFromPersisted(persisted);
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId.exportUserIdForPersistence()).not.toBe("  ");
      expect(state.userId.exportUserIdForPersistence()).not.toBe("");
      expect(state.datadogId.exportDatadogIdForPersistence()).not.toBe("");
    });

    it("should force pushDevicesSyncState to unsynced when generating new userId so backend is updated with new equipment_id", () => {
      const persisted: PersistedIdentities = {
        deviceIds: ["device-1"],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: "https://push.example.com",
      };
      const action = identitiesSlice.actions.initFromPersisted(persisted);
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId.exportUserIdForPersistence()).not.toBe(
        initialIdentitiesState.userId.exportUserIdForPersistence(),
      );
      expect(state.pushDevicesSyncState).toBe("unsynced");
      expect(state.pushDevicesServiceUrl).toBe("https://push.example.com");
      expect(state.deviceIds).toHaveLength(1);
    });
  });

  describe("importFromLegacy", () => {
    it("should set userId and datadogId when both provided", () => {
      const action = identitiesSlice.actions.importFromLegacy({
        userId: "legacy-user-1",
        datadogId: "legacy-dd-1",
      });
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId.exportUserIdForPersistence()).toBe("legacy-user-1");
      expect(state.datadogId.exportDatadogIdForPersistence()).toBe("legacy-dd-1");
    });

    it("should generate new datadogId when only userId is provided", () => {
      const action = identitiesSlice.actions.importFromLegacy({ userId: "legacy-user-2" });
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId.exportUserIdForPersistence()).toBe("legacy-user-2");
      expect(state.datadogId).toBeInstanceOf(DatadogId);
      expect(state.datadogId.exportDatadogIdForPersistence()).not.toBe(
        initialIdentitiesState.datadogId.exportDatadogIdForPersistence(),
      );
    });
  });

  describe("initFromScratch", () => {
    it("should set new userId and datadogId (uuid)", () => {
      const action = identitiesSlice.actions.initFromScratch();
      const state = identitiesSlice.reducer(initialIdentitiesState, action);

      expect(state.userId).toBeInstanceOf(UserId);
      expect(state.datadogId).toBeInstanceOf(DatadogId);
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
