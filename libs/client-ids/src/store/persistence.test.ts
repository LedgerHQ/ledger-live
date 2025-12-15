import { exportIdentitiesForPersistence } from "./persistence";
import { IdentitiesState, DUMMY_USER_ID, DUMMY_DATADOG_ID } from "./types";
import { DeviceId } from "../ids";

describe("persistence", () => {
  describe("exportIdentitiesForPersistence", () => {
    it("should export identities state for persistence", () => {
      const deviceId1 = DeviceId.fromString("device-1");
      const deviceId2 = DeviceId.fromString("device-2");
      const state: IdentitiesState = {
        userId: DUMMY_USER_ID,
        datadogId: DUMMY_DATADOG_ID,
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

    it("should export synced state", () => {
      const deviceId = DeviceId.fromString("device-1");
      const state: IdentitiesState = {
        userId: DUMMY_USER_ID,
        datadogId: DUMMY_DATADOG_ID,
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
        userId: DUMMY_USER_ID,
        datadogId: DUMMY_DATADOG_ID,
        deviceIds: [],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: null,
      };

      const persisted = exportIdentitiesForPersistence(state);

      expect(persisted.deviceIds).toHaveLength(0);
      expect(persisted.pushDevicesSyncState).toBe("synced");
      expect(persisted.pushDevicesServiceUrl).toBeNull();
    });

    it("should export userId when not dummy", () => {
      const { UserId } = require("../ids");
      const realUserId = UserId.fromString("real-user-123");
      const state: IdentitiesState = {
        userId: realUserId,
        datadogId: DUMMY_DATADOG_ID,
        deviceIds: [],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: null,
      };

      const persisted = exportIdentitiesForPersistence(state);

      expect(persisted.userId).toBe("real-user-123");
    });

    it("should export null userId when dummy", () => {
      const state: IdentitiesState = {
        userId: DUMMY_USER_ID,
        datadogId: DUMMY_DATADOG_ID,
        deviceIds: [],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: null,
      };

      const persisted = exportIdentitiesForPersistence(state);

      expect(persisted.userId).toBeNull();
    });

    it("should export datadogId when not dummy", () => {
      const { DatadogId } = require("../ids");
      const realDatadogId = DatadogId.fromString("real-datadog-456");
      const state: IdentitiesState = {
        userId: DUMMY_USER_ID,
        datadogId: realDatadogId,
        deviceIds: [],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: null,
      };

      const persisted = exportIdentitiesForPersistence(state);

      expect(persisted.datadogId).toBe("real-datadog-456");
    });

    it("should export null datadogId when dummy", () => {
      const state: IdentitiesState = {
        userId: DUMMY_USER_ID,
        datadogId: DUMMY_DATADOG_ID,
        deviceIds: [],
        pushDevicesSyncState: "synced",
        pushDevicesServiceUrl: null,
      };

      const persisted = exportIdentitiesForPersistence(state);

      expect(persisted.datadogId).toBeNull();
    });
  });
});
