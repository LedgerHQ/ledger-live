import {
  DeviceModelId,
  type ConnectedDevice,
  type DiscoveredDevice,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";

import { isMatchingConnectedDevice } from "./isMatchingConnectedDevice";

const makeConnectedDevice = (overrides: Partial<ConnectedDevice> = {}): ConnectedDevice =>
  ({
    id: "ble-id",
    sessionId: "session-id",
    modelId: DeviceModelId.NANO_X,
    name: "Ledger Nano X",
    type: "BLE",
    transport: rnBleTransportIdentifier,
    ...overrides,
  }) as ConnectedDevice;

const makeDiscoveredDevice = (overrides: Partial<DiscoveredDevice> = {}): DiscoveredDevice =>
  ({
    id: "ble-id",
    name: "Ledger Nano X",
    deviceModel: { id: "nanoX", model: DeviceModelId.NANO_X, name: "Ledger Nano X" },
    transport: rnBleTransportIdentifier,
    ...overrides,
  }) as DiscoveredDevice;

describe("isMatchingConnectedDevice", () => {
  it("should return false when transports differ", () => {
    const connected = makeConnectedDevice({ id: "same-id", transport: rnHidTransportIdentifier });
    const discovered = makeDiscoveredDevice({ id: "same-id", transport: rnBleTransportIdentifier });

    expect(isMatchingConnectedDevice(connected, discovered)).toBe(false);
  });

  describe.each([
    ["RN_HID", rnHidTransportIdentifier],
    ["Speculos", speculosIdentifier],
  ])("%s", (_, transport: TransportIdentifier) => {
    it("should match by model when ids differ", () => {
      const connected = makeConnectedDevice({
        id: "usb_1002",
        transport,
        type: "USB",
        modelId: DeviceModelId.NANO_X,
      });
      const discovered = makeDiscoveredDevice({
        id: "1002",
        transport,
        deviceModel: { id: "nanoX", model: DeviceModelId.NANO_X, name: "Ledger Nano X" },
      });

      expect(isMatchingConnectedDevice(connected, discovered)).toBe(true);
    });

    it("should not match when models differ", () => {
      const connected = makeConnectedDevice({
        id: "usb_1002",
        transport,
        type: "USB",
        modelId: DeviceModelId.NANO_X,
      });
      const discovered = makeDiscoveredDevice({
        id: "1002",
        transport,
        deviceModel: { id: "stax", model: DeviceModelId.STAX, name: "Ledger Stax" },
      });

      expect(isMatchingConnectedDevice(connected, discovered)).toBe(false);
    });
  });

  describe.each([
    ["RN_BLE", rnBleTransportIdentifier],
    ["MockServer", mockserverIdentifier],
  ])("%s", (_, transport: TransportIdentifier) => {
    it("should match when id and transport are the same", () => {
      const connected = makeConnectedDevice({ id: "device-1", transport });
      const discovered = makeDiscoveredDevice({ id: "device-1", transport });

      expect(isMatchingConnectedDevice(connected, discovered)).toBe(true);
    });

    it("should not match another device with the same model and name but a different id", () => {
      const connected = makeConnectedDevice({ id: "device-1", name: "My Flex", transport });
      const discovered = makeDiscoveredDevice({ id: "device-2", name: "My Flex", transport });

      expect(isMatchingConnectedDevice(connected, discovered)).toBe(false);
    });
  });
});
