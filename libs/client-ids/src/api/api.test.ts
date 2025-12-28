import { createPushDevicesRequest } from "./api";
import * as apiIndex from "./index";
import { DeviceId } from "../ids";

describe("api", () => {
  describe("index exports", () => {
    it("should export all API functions and types", () => {
      expect(apiIndex.createPushDevicesRequest).toBeDefined();
      expect(apiIndex.pushDevicesApi).toBeDefined();
      expect(typeof apiIndex.createPushDevicesRequest).toBe("function");
    });
  });

  describe("createPushDevicesRequest", () => {
    it("should create a push devices request with userId and deviceIds", () => {
      const userId = "user-123";
      const deviceId1 = DeviceId.fromString("device-1");
      const deviceId2 = DeviceId.fromString("device-2");
      const deviceIds = [deviceId1, deviceId2];

      const request = createPushDevicesRequest(userId, deviceIds);

      expect(request.equipment_id).toBe(userId);
      expect(request.devices).toHaveLength(2);
      expect(request.devices[0]).toBe("device-1");
      expect(request.devices[1]).toBe("device-2");
    });

    it("should handle empty deviceIds array", () => {
      const userId = "user-123";
      const deviceIds: DeviceId[] = [];

      const request = createPushDevicesRequest(userId, deviceIds);

      expect(request.equipment_id).toBe(userId);
      expect(request.devices).toHaveLength(0);
    });
  });
});
