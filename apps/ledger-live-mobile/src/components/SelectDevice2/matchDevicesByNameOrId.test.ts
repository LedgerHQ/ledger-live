import {
  matchDeviceByDeviceId,
  matchDeviceByName,
  findMatchingNewDevice,
  isFormattedAsNewDeviceDefaultBleName,
  isFormattedAsOldDeviceDefaultBleName,
  findMatchingOldDevice,
} from "./matchDevicesByNameOrId";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";

const makeDevice = (overrides: Partial<Device> = {}): Device => ({
  deviceId: "device-123",
  deviceName: undefined,
  modelId: DeviceModelId.nanoX,
  wired: false,
  ...overrides,
});

describe("isFormattedAsOldDeviceDefaultBleName", () => {
  test.each([
    ["old format with model name", "Ledger Nano X 123A"],
    ["old format with different model name", "Ledger Nano S Plus 456B"],
    ["old format with lowercase hex", "Ledger Nano X 123a"],
    ["old format with mixed case hex", "Ledger Nano X 46bc"],
  ])("returns true for %s", (_, name) => {
    expect(isFormattedAsOldDeviceDefaultBleName(name)).toBe(true);
  });

  test.each([
    ["new format (4 hex digits only)", "ABCD"],
    ["new format with lowercase hex", "abcd"],
    ["custom device name", "My Ledger Device"],
    ["empty string", ""],
    ["old format with empty model name", "Ledger 789C"],
    ["old format without hex suffix", "Ledger Nano X"],
    ["old format with non-hex suffix", "Ledger Nano X XYZ"],
    ["old format with 3 hex digits", "Ledger Nano X ABC"],
    ["old format with 5 hex digits", "Ledger Nano X ABCDE"],
  ])("returns false for %s", (description, name) => {
    expect(isFormattedAsOldDeviceDefaultBleName(name)).toBe(false);
  });
});

describe("isFormattedAsNewDeviceDefaultBleName", () => {
  test.each([
    ["4 uppercase hex digits", "ABCD"],
    ["4 lowercase hex digits", "abcd"],
    ["4 mixed case hex digits", "AbCd"],
    ["4 numeric hex digits", "1234"],
    ["mixed alphanumeric hex digits (A1B2)", "A1b2"],
    ["mixed alphanumeric hex digits (FF00)", "Ff00"],
  ])("returns true for %s", (description, name) => {
    expect(isFormattedAsNewDeviceDefaultBleName(name)).toBe(true);
  });

  test.each([
    ["old format", "Ledger (Nano X) ABCD"],
    ["custom device name", "My Ledger Device"],
    ["empty string", ""],
    ["3 hex digits", "ABC"],
    ["5 hex digits", "ABCDE"],
    ["non-hex characters (XYZ)", "XYZ"],
    ["non-hex characters (G123)", "G123"],
    ["string with spaces", "AB CD"],
  ])("returns false for %s", (description, name) => {
    expect(isFormattedAsNewDeviceDefaultBleName(name)).toBe(false);
  });
});

describe("matchDeviceByDeviceId", () => {
  test.each([
    ["deviceIds match", "device-123", "device-123", true],
    ["deviceIds do not match", "device-123", "device-456", false],
    ["deviceIds are empty strings", "", "", true],
  ])("returns %s when %s", (_, knownDeviceId, scannedDeviceId, expected) => {
    const knownDevice = makeDevice({ deviceId: knownDeviceId });
    const scannedDevice = makeDevice({ deviceId: scannedDeviceId });

    expect(matchDeviceByDeviceId({ deviceA: knownDevice, deviceB: scannedDevice })).toBe(expected);
  });
});

describe("matchDeviceByName", () => {
  test.each([
    ["device names are identical", "My Device", "My Device", true],
    ["old format matches new format with same hex suffix", "Ledger Nano X ABCD", "ABCD", true],
  ])("returns %s when %s", (_, oldDeviceName, newDeviceName, expected) => {
    const oldDevice = makeDevice({ deviceName: oldDeviceName });
    const newDevice = makeDevice({ deviceName: newDeviceName });

    expect(matchDeviceByName({ oldDevice, newDevice })).toBe(expected);
  });

  test.each([
    ["oldDevice has null deviceName", null, "Device 1"],
    ["oldDevice has undefined deviceName", undefined, "Device 1"],
    ["newDevice has empty deviceName", "Device 1", ""],
    ["old format does not match new format with different hex", "Ledger Nano X ABCD", "EFGH"],
    ["oldDevice has new format and newDevice has old format", "ABCD", "Ledger Nano X ABCD"],
    ["both have old format but different hex", "Ledger Nano X ABCD", "Ledger Nano X EFGH"],
    ["oldDevice has custom name and newDevice has new format", "My Custom Device", "ABCD"],
    ["device names do not match", "Device 1", "Device 2"],
    ["new device has old format and old device has new format", "ABCD", "Ledger Nano X ABCD"],
  ])("returns false when %s", (_, oldDeviceName, newDeviceName) => {
    const oldDevice = makeDevice({ deviceName: oldDeviceName });
    const newDevice = makeDevice({ deviceName: newDeviceName });

    expect(matchDeviceByName({ oldDevice: oldDevice, newDevice: newDevice })).toBe(false);
  });
});

describe("findMatchingNewDevice", () => {
  describe("finding a match", () => {
    test("returns matching device by deviceId when found", () => {
      const device = makeDevice({ deviceId: "device-123", deviceName: "Device 1" });
      const newDevices: Device[] = [
        makeDevice({ deviceId: "device-456", deviceName: "Device 2" }),
        makeDevice({ deviceId: "device-123", deviceName: "Device 3" }),
        makeDevice({ deviceId: "device-789", deviceName: "Device 1" }),
      ];

      const result = findMatchingNewDevice(device, newDevices);
      expect(result).toEqual(newDevices[1]);
    });

    test("returns matching device by name when deviceId does not match", () => {
      const device = makeDevice({ deviceId: "device-123", deviceName: "Custom Device Name" });
      const newDevices: Device[] = [
        makeDevice({ deviceId: "device-456", deviceName: "Device 1" }),
        makeDevice({ deviceId: "device-789", deviceName: "Custom Device Name" }),
      ];

      const result = findMatchingNewDevice(device, newDevices);
      expect(result).toEqual(newDevices[1]);
    });

    test("returns matching device by old-to-new format when deviceId does not match", () => {
      const device = makeDevice({
        deviceId: "device-123",
        deviceName: "Ledger Nano X ABCD",
      });
      const newDevices: Device[] = [
        makeDevice({ deviceId: "device-456", deviceName: "Device 2" }),
        makeDevice({ deviceId: "device-789", deviceName: "ABCD" }),
      ];

      const result = findMatchingNewDevice(device, newDevices);
      expect(result).toEqual(newDevices[1]);
    });

    test("prioritizes deviceId match over name match", () => {
      const device = makeDevice({ deviceId: "device-123", deviceName: "Device 1" });
      const newDevices: Device[] = [
        makeDevice({ deviceId: "device-456", deviceName: "Device 1" }),
        makeDevice({ deviceId: "device-123", deviceName: "Different Name" }),
      ];

      const result = findMatchingNewDevice(device, newDevices);
      expect(result).toEqual(newDevices[1]);
    });

    test("returns first matching device by name when multiple name matches exist", () => {
      const device = makeDevice({ deviceId: "device-999", deviceName: "Device 1" });
      const newDevices: Device[] = [
        makeDevice({ deviceId: "device-456", deviceName: "Device 1" }),
        makeDevice({ deviceId: "device-789", deviceName: "Device 1" }),
      ];

      const result = findMatchingNewDevice(device, newDevices);
      expect(result).toEqual(newDevices[0]);
    });
  });

  describe("no match found", () => {
    test("returns null when no match is found", () => {
      const device = makeDevice({ deviceId: "device-123", deviceName: "Device 1" });
      const newDevices: Device[] = [
        makeDevice({ deviceId: "device-456", deviceName: "Device 2" }),
        makeDevice({ deviceId: "device-789", deviceName: "Device 3" }),
      ];

      const result = findMatchingNewDevice(device, newDevices);
      expect(result).toBe(null);
    });

    test("returns null when newDevices array is empty", () => {
      const device = makeDevice({ deviceId: "device-123", deviceName: "Device 1" });
      const newDevices: Device[] = [];

      const result = findMatchingNewDevice(device, newDevices);
      expect(result).toBe(null);
    });

    test("returns null when device has no deviceName and no deviceId match", () => {
      const device = makeDevice({ deviceId: "device-123", deviceName: null });
      const newDevices: Device[] = [makeDevice({ deviceId: "device-456", deviceName: "Device 1" })];

      const result = findMatchingNewDevice(device, newDevices);
      expect(result).toBe(null);
    });
  });

  describe("ignore unmatching modelId", () => {
    test("returns null when devices have matching deviceId but different modelId", () => {
      const device = makeDevice({
        deviceId: "device-123",
        deviceName: "Device 1",
        modelId: DeviceModelId.nanoX,
      });
      const newDevices: Device[] = [
        makeDevice({
          deviceId: "device-123",
          deviceName: "Device 1",
          modelId: DeviceModelId.stax,
        }),
      ];

      const result = findMatchingNewDevice(device, newDevices);
      expect(result).toBe(null);
    });

    test("returns null when devices have matching name but different modelId", () => {
      const device = makeDevice({
        deviceId: "device-123",
        deviceName: "Device 1",
        modelId: DeviceModelId.nanoX,
      });
      const newDevices: Device[] = [
        makeDevice({
          deviceId: "device-456",
          deviceName: "Device 1",
          modelId: DeviceModelId.stax,
        }),
      ];

      const result = findMatchingNewDevice(device, newDevices);
      expect(result).toBe(null);
    });

    test("returns null when devices have matching old-to-new format name but different modelId", () => {
      const device = makeDevice({
        deviceId: "device-123",
        deviceName: "Ledger (Nano X) ABCD",
        modelId: DeviceModelId.nanoX,
      });
      const newDevices: Device[] = [
        makeDevice({
          deviceId: "device-456",
          deviceName: "ABCD",
          modelId: DeviceModelId.stax,
        }),
      ];

      const result = findMatchingNewDevice(device, newDevices);
      expect(result).toBe(null);
    });
  });
});

describe("findMatchingOldDevice", () => {
  describe("finding a match", () => {
    test("returns matching device by deviceId when found", () => {
      const newDevice = makeDevice({ deviceId: "device-123", deviceName: "ABCD" });
      const oldDevices: Device[] = [
        makeDevice({ deviceId: "device-456", deviceName: "Ledger Nano X EFGH" }),
        makeDevice({ deviceId: "device-123", deviceName: "Ledger Nano X ABCD" }),
        makeDevice({ deviceId: "device-789", deviceName: "Ledger Nano X ABCD" }),
      ];

      const result = findMatchingOldDevice(newDevice, oldDevices);
      expect(result).toEqual(oldDevices[1]);
    });

    test("returns matching device by name when deviceId does not match", () => {
      const newDevice = makeDevice({
        deviceId: "device-123",
        deviceName: "Custom Device Name",
      });
      const oldDevices: Device[] = [
        makeDevice({ deviceId: "device-456", deviceName: "Ledger Nano X EFGH" }),
        makeDevice({ deviceId: "device-789", deviceName: "Custom Device Name" }),
      ];

      const result = findMatchingOldDevice(newDevice, oldDevices);
      expect(result).toEqual(oldDevices[1]);
    });

    test("returns matching device by new-to-old format when deviceId does not match", () => {
      const newDevice = makeDevice({
        deviceId: "device-123",
        deviceName: "ABCD",
      });
      const oldDevices: Device[] = [
        makeDevice({ deviceId: "device-456", deviceName: "Ledger Nano X EFGH" }),
        makeDevice({ deviceId: "device-789", deviceName: "Ledger Nano X ABCD" }),
      ];

      const result = findMatchingOldDevice(newDevice, oldDevices);
      expect(result).toEqual(oldDevices[1]);
    });

    test("prioritizes deviceId match over name match", () => {
      const newDevice = makeDevice({ deviceId: "device-123", deviceName: "ABCD" });
      const oldDevices: Device[] = [
        makeDevice({ deviceId: "device-456", deviceName: "Ledger Nano X ABCD" }),
        makeDevice({ deviceId: "device-123", deviceName: "Ledger Nano X EFGH" }),
      ];

      const result = findMatchingOldDevice(newDevice, oldDevices);
      expect(result).toEqual(oldDevices[1]);
    });

    test("returns first matching device by name when multiple name matches exist", () => {
      const newDevice = makeDevice({ deviceId: "device-999", deviceName: "ABCD" });
      const oldDevices: Device[] = [
        makeDevice({ deviceId: "device-456", deviceName: "Ledger Nano X ABCD" }),
        makeDevice({ deviceId: "device-789", deviceName: "Ledger Nano X ABCD" }),
      ];

      const result = findMatchingOldDevice(newDevice, oldDevices);
      expect(result).toEqual(oldDevices[0]);
    });
  });

  describe("no match found", () => {
    test("returns null when no match is found", () => {
      const newDevice = makeDevice({ deviceId: "device-123", deviceName: "ABCD" });
      const oldDevices: Device[] = [
        makeDevice({ deviceId: "device-456", deviceName: "Ledger Nano X EFGH" }),
        makeDevice({ deviceId: "device-789", deviceName: "Ledger Nano X EFGH" }),
      ];

      const result = findMatchingOldDevice(newDevice, oldDevices);
      expect(result).toBe(null);
    });

    test("returns null when oldDevices array is empty", () => {
      const newDevice = makeDevice({ deviceId: "device-123", deviceName: "ABCD" });
      const oldDevices: Device[] = [];

      const result = findMatchingOldDevice(newDevice, oldDevices);
      expect(result).toBe(null);
    });

    test("returns null when device has no deviceName and no deviceId match", () => {
      const newDevice = makeDevice({ deviceId: "device-123", deviceName: null });
      const oldDevices: Device[] = [
        makeDevice({ deviceId: "device-456", deviceName: "Ledger Nano X ABCD" }),
      ];

      const result = findMatchingOldDevice(newDevice, oldDevices);
      expect(result).toBe(null);
    });
  });

  describe("ignore unmatching modelId", () => {
    test("returns null when devices have matching deviceId but different modelId", () => {
      const newDevice = makeDevice({
        deviceId: "device-123",
        deviceName: "ABCD",
        modelId: DeviceModelId.nanoX,
      });
      const oldDevices: Device[] = [
        makeDevice({
          deviceId: "device-123",
          deviceName: "Ledger Nano X ABCD",
          modelId: DeviceModelId.stax,
        }),
      ];

      const result = findMatchingOldDevice(newDevice, oldDevices);
      expect(result).toBe(null);
    });

    test("returns null when devices have matching name but different modelId", () => {
      const newDevice = makeDevice({
        deviceId: "device-123",
        deviceName: "ABCD",
        modelId: DeviceModelId.nanoX,
      });
      const oldDevices: Device[] = [
        makeDevice({
          deviceId: "device-456",
          deviceName: "Ledger Nano X ABCD",
          modelId: DeviceModelId.stax,
        }),
      ];

      const result = findMatchingOldDevice(newDevice, oldDevices);
      expect(result).toBe(null);
    });

    test("returns null when devices have matching new-to-old format name but different modelId", () => {
      const newDevice = makeDevice({
        deviceId: "device-123",
        deviceName: "ABCD",
        modelId: DeviceModelId.nanoX,
      });
      const oldDevices: Device[] = [
        makeDevice({
          deviceId: "device-456",
          deviceName: "Ledger Nano X ABCD",
          modelId: DeviceModelId.stax,
        }),
      ];

      const result = findMatchingOldDevice(newDevice, oldDevices);
      expect(result).toBe(null);
    });
  });
});
