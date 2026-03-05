import { exportIdentitiesForPersistence } from "./persistence";
import { IdentitiesState, initialIdentitiesState } from "./types";
import { DeviceId, UserId, DatadogId } from "../ids";

describe("persistence", () => {
  describe("exportIdentitiesForPersistence", () => {
    it("should export identities state for persistence", () => {
      const deviceId1 = DeviceId.fromString("device-1");
      const deviceId2 = DeviceId.fromString("device-2");
      const state: IdentitiesState = {
        ...initialIdentitiesState,
        deviceIds: [deviceId1, deviceId2],
        pushDevicesSyncState: "unsynced",
        pushDevicesServiceUrl: "https://api.example.com",
      };

      const persisted = exportIdentitiesForPersistence(state);

      expect(persisted.deviceIds).toHaveLength(2);
      expect(persisted.deviceIds[0]).toBe("device-1");
      expect(persisted.deviceIds[1]).toBe("device-2");
      expect(persisted.pushDevicesSyncState).toBe("unsynced");
      expect(persisted.pushDevicesServiceUrl).toBe("https://api.example.com");
    });

    it("should export userId and datadogId when not dummy", () => {
      const state: IdentitiesState = {
        ...initialIdentitiesState,
        userId: UserId.fromString("user-123"),
        datadogId: DatadogId.fromString("dd-456"),
        deviceIds: [],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: null,
      };
      const persisted = exportIdentitiesForPersistence(state);
      expect(persisted.userId).toBe("user-123");
      expect(persisted.datadogId).toBe("dd-456");
    });

    it("should export synced state", () => {
      const deviceId = DeviceId.fromString("device-1");
      const state: IdentitiesState = {
        ...initialIdentitiesState,
        deviceIds: [deviceId],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: "https://api.example.com",
      };

      const persisted = exportIdentitiesForPersistence(state);

      expect(persisted.pushDevicesSyncState).toBe("synced");
      expect(persisted.pushDevicesServiceUrl).toBe("https://api.example.com");
    });

    it("should handle empty deviceIds", () => {
      const state: IdentitiesState = {
        ...initialIdentitiesState,
        deviceIds: [],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: null,
      };

      const persisted = exportIdentitiesForPersistence(state);

      expect(persisted.deviceIds).toHaveLength(0);
      expect(persisted.pushDevicesSyncState).toBe("synced");
      expect(persisted.pushDevicesServiceUrl).toBeNull();
    });
  });
});
