import type { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  ConnectDeviceStateMachineEventTypes,
  type ConnectDeviceStateMachineEvent,
  type KnownDevice,
  type MatchedDevice,
} from "./types";
import {
  buildDisplayedDevices,
  filterKnownDevicesByAcceptedModels,
  findMatchedDevice,
  getFirstMatchedDeviceFromDiscoveryEvent,
  getMatchedDevicesFromDiscoveryEvent,
  getSelectedMatchedDeviceFromDiscoveryEvent,
  isSameKnownDevice,
} from "./utils";

// Test helpers
const knownDeviceA = {
  transport: "RN_BLE",
  deviceModelId: DeviceModelId.nanoX,
  id: "known-device-a",
  name: "Ledger Nano X",
} as KnownDevice;

const knownDeviceB = {
  transport: "RN_BLE",
  deviceModelId: DeviceModelId.nanoSP,
  id: "known-device-b",
  name: "Ledger Nano S Plus",
} as KnownDevice;

const makeDiscoveredDevice = (knownDevice: KnownDevice): DiscoveredDevice =>
  ({
    id: `discovered-${knownDevice.id}`,
    name: knownDevice.name,
    deviceModel: { model: knownDevice.deviceModelId },
    transport: knownDevice.transport,
  }) as unknown as DiscoveredDevice;

const makeMatchedDevice = (knownDevice: KnownDevice): MatchedDevice => ({
  knownDevice,
  discoveredDevice: makeDiscoveredDevice(knownDevice),
});

// Tests
describe("Utils", () => {
  describe("filterKnownDevicesByAcceptedModels", () => {
    it("should return all known devices when no accepted model is provided", () => {
      expect(filterKnownDevicesByAcceptedModels([knownDeviceA, knownDeviceB])).toEqual([
        knownDeviceA,
        knownDeviceB,
      ]);
    });

    it("should keep only known devices matching accepted models", () => {
      expect(
        filterKnownDevicesByAcceptedModels([knownDeviceA, knownDeviceB], [DeviceModelId.nanoX]),
      ).toEqual([knownDeviceA]);
    });
  });

  describe("isSameKnownDevice", () => {
    it("should return true if known devices are the same", () => {
      // Arrange
      const knownDeviceA = {
        transport: "RN_BLE",
        deviceModelId: DeviceModelId.nanoX,
        id: "known-device-a",
        name: "Ledger Nano X",
      } as KnownDevice;

      const knownDeviceB = {
        transport: "RN_BLE",
        deviceModelId: DeviceModelId.nanoX,
        id: "known-device-a",
        name: "Ledger Nano X",
      } as KnownDevice;

      // Act
      const result = isSameKnownDevice(knownDeviceA, knownDeviceB);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false if known devices are not the same", () => {
      // Arrange
      const knownDeviceA = {
        transport: "RN_BLE",
        deviceModelId: DeviceModelId.nanoX,
        id: "known-device-a",
        name: "Ledger Nano X",
      } as KnownDevice;

      const knownDeviceB = {
        transport: "RN_BLE",
        deviceModelId: DeviceModelId.nanoS,
        id: "known-device-b",
        name: "Ledger Nano S",
      } as KnownDevice;

      // Act
      const result = isSameKnownDevice(knownDeviceA, knownDeviceB);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("findMatchedDevice", () => {
    it("should return matched device if it exists", () => {
      // Arrange
      const matchedDeviceA = makeMatchedDevice(knownDeviceA);
      const matchedDevices = [matchedDeviceA, makeMatchedDevice(knownDeviceB)];

      // Act
      const result = findMatchedDevice(knownDeviceA, matchedDevices);

      // Assert
      expect(result).toBe(matchedDeviceA);
    });

    it("should return null if matched device does not exist", () => {
      // Arrange
      const matchedDevices = [makeMatchedDevice(knownDeviceB)];

      // Act
      const result = findMatchedDevice(knownDeviceA, matchedDevices);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("getFirstMatchedDeviceFromDiscoveryEvent", () => {
    it("should return matched device if it exists", () => {
      // Arrange
      const matchedDevice = makeMatchedDevice(knownDeviceA);
      const event: ConnectDeviceStateMachineEvent = {
        type: ConnectDeviceStateMachineEventTypes.DiscoveredOneDevice,
        matchedDevices: [matchedDevice],
      };

      // Act
      const result = getFirstMatchedDeviceFromDiscoveryEvent(event);

      // Assert
      expect(result).toEqual(matchedDevice);
    });

    it("should return null if no matched device exists", () => {
      // Arrange
      const event: ConnectDeviceStateMachineEvent = {
        type: ConnectDeviceStateMachineEventTypes.DiscoveredNoDevice,
      };

      // Act
      const result = getFirstMatchedDeviceFromDiscoveryEvent(event);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("getMatchedDevicesFromDiscoveryEvent", () => {
    it("should return matched devices if one device is discovered", () => {
      // Arrange
      const matchedDevices = [makeMatchedDevice(knownDeviceA)];
      const event: ConnectDeviceStateMachineEvent = {
        type: ConnectDeviceStateMachineEventTypes.DiscoveredOneDevice,
        matchedDevices,
      };

      // Act
      const result = getMatchedDevicesFromDiscoveryEvent(event);

      // Assert
      expect(result).toBe(matchedDevices);
    });

    it("should return matched devices if many devices are discovered", () => {
      // Arrange
      const matchedDevices = [makeMatchedDevice(knownDeviceA), makeMatchedDevice(knownDeviceB)];
      const event: ConnectDeviceStateMachineEvent = {
        type: ConnectDeviceStateMachineEventTypes.DiscoveredManyDevices,
        matchedDevices,
      };

      // Act
      const result = getMatchedDevicesFromDiscoveryEvent(event);

      // Assert
      expect(result).toBe(matchedDevices);
    });

    it("should return empty array if no device is discovered", () => {
      // Arrange
      const event: ConnectDeviceStateMachineEvent = {
        type: ConnectDeviceStateMachineEventTypes.DiscoveredNoDevice,
      };

      // Act
      const result = getMatchedDevicesFromDiscoveryEvent(event);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("getSelectedMatchedDeviceFromDiscoveryEvent", () => {
    it("should return selected matched device if it exists", () => {
      // Arrange
      const selectedMatchedDevice = makeMatchedDevice(knownDeviceB);
      const event: ConnectDeviceStateMachineEvent = {
        type: ConnectDeviceStateMachineEventTypes.DiscoveredManyDevices,
        matchedDevices: [makeMatchedDevice(knownDeviceA), selectedMatchedDevice],
      };

      // Act
      const result = getSelectedMatchedDeviceFromDiscoveryEvent(event, knownDeviceB);

      // Assert
      expect(result).toBe(selectedMatchedDevice);
    });

    it("should return null if selected matched device does not exist", () => {
      // Arrange
      const event: ConnectDeviceStateMachineEvent = {
        type: ConnectDeviceStateMachineEventTypes.DiscoveredNoDevice,
      };

      // Act
      const result = getSelectedMatchedDeviceFromDiscoveryEvent(event, knownDeviceA);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null if selected known device does not exist", () => {
      // Arrange
      const event: ConnectDeviceStateMachineEvent = {
        type: ConnectDeviceStateMachineEventTypes.DiscoveredManyDevices,
        matchedDevices: [makeMatchedDevice(knownDeviceA)],
      };

      // Act
      const result = getSelectedMatchedDeviceFromDiscoveryEvent(event, null);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("buildDisplayedDevices", () => {
    it("should return available displayed device if known device is matched", () => {
      // Arrange
      const send = jest.fn();
      const matchedDevice = makeMatchedDevice(knownDeviceA);

      // Act
      const result = buildDisplayedDevices([knownDeviceA], [matchedDevice], send);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: "available",
        knownDevice: knownDeviceA,
      });
    });

    it("should send available device event when available displayed device is selected", () => {
      // Arrange
      const send = jest.fn();
      const matchedDevice = makeMatchedDevice(knownDeviceA);
      const displayedDevices = buildDisplayedDevices([knownDeviceA], [matchedDevice], send);

      // Act
      displayedDevices[0]?.onSelect();

      // Assert
      expect(send).toHaveBeenCalledWith({
        type: ConnectDeviceStateMachineEventTypes.UserTapsAvailableDevice,
        matchedDevice,
      });
    });

    it("should return unavailable displayed device if known device is not matched", () => {
      // Arrange
      const send = jest.fn();

      // Act
      const result = buildDisplayedDevices([knownDeviceA], [], send);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: "not-available",
        knownDevice: knownDeviceA,
      });
    });

    it("should send unavailable device event when unavailable displayed device is selected", () => {
      // Arrange
      const send = jest.fn();
      const displayedDevices = buildDisplayedDevices([knownDeviceA], [], send);

      // Act
      displayedDevices[0]?.onSelect();

      // Assert
      expect(send).toHaveBeenCalledWith({
        type: ConnectDeviceStateMachineEventTypes.UserTapsUnavailableDevice,
        knownDevice: knownDeviceA,
      });
    });
  });
});
