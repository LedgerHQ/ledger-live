import {
  DeviceModelId as DMKDeviceModelId,
  type DiscoveredDevice,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";

import { mergeDiscoveredDevices } from "./mergeDiscoveredDevices";
import type { ConnectNewDeviceGetDiscoveredDeviceKey, ListedDevice } from "./types";

const bleTransport = "RN_BLE" as TransportIdentifier;
const usbTransport = "RN_HID" as TransportIdentifier;

const makeDiscoveredDevice = (id: string, overrides: Partial<DiscoveredDevice> = {}) =>
  ({
    id,
    name: `Device ${id}`,
    deviceModel: { id: "nanoX", model: DMKDeviceModelId.NANO_X, name: "Ledger Nano X" },
    transport: bleTransport,
    ...overrides,
  }) as DiscoveredDevice;

const deviceA = makeDiscoveredDevice("a");
const deviceB = makeDiscoveredDevice("b");
const deviceC = makeDiscoveredDevice("c");

const getDeviceKeyById: ConnectNewDeviceGetDiscoveredDeviceKey = ({ transport, id }) =>
  `${transport}:${id}`;

const available = (discoveredDevice: DiscoveredDevice): ListedDevice => ({
  discoveredDevice,
  isAvailable: true,
});

const notAvailable = (discoveredDevice: DiscoveredDevice): ListedDevice => ({
  discoveredDevice,
  isAvailable: false,
});

describe("mergeDiscoveredDevices", () => {
  it("should list the discovered devices in their discovery order when the list is empty", () => {
    expect(mergeDiscoveredDevices([], [deviceB, deviceA], getDeviceKeyById)).toEqual([
      available(deviceB),
      available(deviceA),
    ]);
  });

  it("should keep the listed devices at their position when discovery reorders them", () => {
    const listedDevices = [available(deviceA), available(deviceB)];

    expect(mergeDiscoveredDevices(listedDevices, [deviceB, deviceA], getDeviceKeyById)).toEqual([
      available(deviceA),
      available(deviceB),
    ]);
  });

  it("should add the new devices after the listed devices", () => {
    const listedDevices = [available(deviceB)];

    expect(
      mergeDiscoveredDevices(listedDevices, [deviceC, deviceA, deviceB], getDeviceKeyById),
    ).toEqual([available(deviceB), available(deviceC), available(deviceA)]);
  });

  it("should keep a listed device at its position, not available, when discovery no longer reports it", () => {
    const listedDevices = [available(deviceA), available(deviceB), available(deviceC)];

    expect(mergeDiscoveredDevices(listedDevices, [deviceC, deviceA], getDeviceKeyById)).toEqual([
      available(deviceA),
      notAvailable(deviceB),
      available(deviceC),
    ]);
  });

  it("should make every listed device not available when discovery reports no device", () => {
    const listedDevices = [available(deviceA), notAvailable(deviceB)];

    expect(mergeDiscoveredDevices(listedDevices, [], getDeviceKeyById)).toEqual([
      notAvailable(deviceA),
      notAvailable(deviceB),
    ]);
  });

  it("should make a device available again at its position when discovery reports it again", () => {
    const listedDevices = [notAvailable(deviceA), available(deviceB)];

    expect(mergeDiscoveredDevices(listedDevices, [deviceB, deviceA], getDeviceKeyById)).toEqual([
      available(deviceA),
      available(deviceB),
    ]);
  });

  it("should keep the latest discovered device of a listed device", () => {
    const renamedDeviceA = makeDiscoveredDevice("a", { name: "My device" });

    expect(
      mergeDiscoveredDevices([available(deviceA)], [renamedDeviceA], getDeviceKeyById),
    ).toEqual([available(renamedDeviceA)]);
  });

  it("should identify the devices with the given key", () => {
    const getDeviceKeyByModel: ConnectNewDeviceGetDiscoveredDeviceKey = ({
      transport,
      deviceModel,
    }) => `${transport}:${deviceModel.model}`;
    const usbDevice = makeDiscoveredDevice("usb-1", { transport: usbTransport });
    const rediscoveredUsbDevice = makeDiscoveredDevice("usb-2", { transport: usbTransport });

    expect(
      mergeDiscoveredDevices([available(usbDevice)], [rediscoveredUsbDevice], getDeviceKeyByModel),
    ).toEqual([available(rediscoveredUsbDevice)]);
  });
});
