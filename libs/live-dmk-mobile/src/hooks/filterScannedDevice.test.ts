import { DeviceModelId } from "@ledgerhq/types-devices";
import { filterScannedDevice } from "./filterScannedDevice";
import { ScannedDevice } from "./ScannedDevice";
import { expect, describe, it } from "vitest";

describe("filterScannedDevice", () => {
  // Mock device data for testing
  const mockDevice: ScannedDevice = {
    deviceId: "device-123",
    deviceName: "Test Device",
    wired: false,
    modelId: DeviceModelId.nanoX,
    isAlreadyKnown: false,
  };

  const mockDevice2: ScannedDevice = {
    deviceId: "device-456",
    deviceName: "Test Device 2",
    wired: true,
    modelId: DeviceModelId.nanoS,
    isAlreadyKnown: true,
  };

  const mockDevice3: ScannedDevice = {
    deviceId: "device-789",
    deviceName: "Test Device 3",
    wired: false,
    modelId: DeviceModelId.stax,
    isAlreadyKnown: false,
  };

  describe("when no filters are provided", () => {
    it("should return true for any device", () => {
      expect(filterScannedDevice(mockDevice, {})).toBe(true);
      expect(filterScannedDevice(mockDevice2, {})).toBe(true);
      expect(filterScannedDevice(mockDevice3, {})).toBe(true);
    });

    it("should return true when both filter arrays are undefined", () => {
      expect(
        filterScannedDevice(mockDevice, {
          filterByDeviceModelIds: undefined,
          filterOutDevicesByDeviceIds: undefined,
        }),
      ).toBe(true);
    });
  });

  describe("when filtering by device model IDs", () => {
    it("should return true when device model ID is in the allowed list", () => {
      const result = filterScannedDevice(mockDevice, {
        filterByDeviceModelIds: [DeviceModelId.nanoX, DeviceModelId.nanoS],
      });
      expect(result).toBe(true);
    });

    it("should return false when device model ID is not in the allowed list", () => {
      const result = filterScannedDevice(mockDevice, {
        filterByDeviceModelIds: [DeviceModelId.nanoS, DeviceModelId.stax],
      });
      expect(result).toBe(false);
    });

    it("should return true when filterByDeviceModelIds is an empty array", () => {
      const result = filterScannedDevice(mockDevice, {
        filterByDeviceModelIds: [],
      });
      expect(result).toBe(true);
    });

    it("should return true when filterByDeviceModelIds is undefined", () => {
      const result = filterScannedDevice(mockDevice, {
        filterByDeviceModelIds: undefined,
      });
      expect(result).toBe(true);
    });

    it("should work with single model ID in the filter", () => {
      const result = filterScannedDevice(mockDevice, {
        filterByDeviceModelIds: [DeviceModelId.nanoX],
      });
      expect(result).toBe(true);
    });

    it("should work with multiple model IDs in the filter", () => {
      const result = filterScannedDevice(mockDevice2, {
        filterByDeviceModelIds: [DeviceModelId.nanoX, DeviceModelId.nanoS, DeviceModelId.stax],
      });
      expect(result).toBe(true);
    });
  });

  describe("when filtering out devices by device IDs", () => {
    it("should return false when device ID is in the filter out list", () => {
      const result = filterScannedDevice(mockDevice, {
        filterOutDevicesByDeviceIds: ["device-123", "device-456"],
      });
      expect(result).toBe(false);
    });

    it("should return true when device ID is not in the filter out list", () => {
      const result = filterScannedDevice(mockDevice, {
        filterOutDevicesByDeviceIds: ["device-456", "device-789"],
      });
      expect(result).toBe(true);
    });

    it("should return true when filterOutDevicesByDeviceIds is an empty array", () => {
      const result = filterScannedDevice(mockDevice, {
        filterOutDevicesByDeviceIds: [],
      });
      expect(result).toBe(true);
    });

    it("should return true when filterOutDevicesByDeviceIds is undefined", () => {
      const result = filterScannedDevice(mockDevice, {
        filterOutDevicesByDeviceIds: undefined,
      });
      expect(result).toBe(true);
    });

    it("should work with single device ID in the filter out list", () => {
      const result = filterScannedDevice(mockDevice, {
        filterOutDevicesByDeviceIds: ["device-123"],
      });
      expect(result).toBe(false);
    });

    it("should work with multiple device IDs in the filter out list", () => {
      const result = filterScannedDevice(mockDevice2, {
        filterOutDevicesByDeviceIds: ["device-123", "device-456", "device-789"],
      });
      expect(result).toBe(false);
    });
  });

  describe("when both filters are applied", () => {
    it("should return true when device passes both filters", () => {
      const result = filterScannedDevice(mockDevice, {
        filterByDeviceModelIds: [DeviceModelId.nanoX, DeviceModelId.nanoS],
        filterOutDevicesByDeviceIds: ["device-456", "device-789"],
      });
      expect(result).toBe(true);
    });

    it("should return false when device fails model ID filter", () => {
      const result = filterScannedDevice(mockDevice, {
        filterByDeviceModelIds: [DeviceModelId.nanoS, DeviceModelId.stax],
        filterOutDevicesByDeviceIds: ["device-456", "device-789"],
      });
      expect(result).toBe(false);
    });

    it("should return false when device fails device ID filter", () => {
      const result = filterScannedDevice(mockDevice, {
        filterByDeviceModelIds: [DeviceModelId.nanoX, DeviceModelId.nanoS],
        filterOutDevicesByDeviceIds: ["device-123", "device-456"],
      });
      expect(result).toBe(false);
    });

    it("should return false when device fails both filters", () => {
      const result = filterScannedDevice(mockDevice, {
        filterByDeviceModelIds: [DeviceModelId.nanoS, DeviceModelId.stax],
        filterOutDevicesByDeviceIds: ["device-123", "device-456"],
      });
      expect(result).toBe(false);
    });
  });

  describe("edge cases and boundary conditions", () => {
    it("should handle device with different model IDs correctly", () => {
      const staxDevice: ScannedDevice = {
        ...mockDevice,
        modelId: DeviceModelId.stax,
      };

      expect(
        filterScannedDevice(staxDevice, {
          filterByDeviceModelIds: [DeviceModelId.stax],
        }),
      ).toBe(true);

      expect(
        filterScannedDevice(staxDevice, {
          filterByDeviceModelIds: [DeviceModelId.nanoX, DeviceModelId.nanoS],
        }),
      ).toBe(false);
    });

    it("should handle device with different device IDs correctly", () => {
      const customDevice: ScannedDevice = {
        ...mockDevice,
        deviceId: "custom-device-999",
      };

      expect(
        filterScannedDevice(customDevice, {
          filterOutDevicesByDeviceIds: ["device-123", "device-456"],
        }),
      ).toBe(true);

      expect(
        filterScannedDevice(customDevice, {
          filterOutDevicesByDeviceIds: ["custom-device-999", "device-456"],
        }),
      ).toBe(false);
    });

    it("should handle all possible DeviceModelId values", () => {
      const allModelIds = Object.values(DeviceModelId);

      allModelIds.forEach(modelId => {
        const testDevice: ScannedDevice = {
          ...mockDevice,
          modelId,
        };

        expect(
          filterScannedDevice(testDevice, {
            filterByDeviceModelIds: [modelId],
          }),
        ).toBe(true);
      });
    });
  });
});
