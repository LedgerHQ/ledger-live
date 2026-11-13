import {
  type ConnectedDevice,
  DeviceModelId as DMKDeviceModelId,
  type DiscoveredDevice,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";

import { buildDeviceList, type BuildDeviceListInput } from "./buildDeviceList";
import {
  DeviceListItemStatuses,
  type ConnectKnownOrNewDeviceFindMatchingDevice,
  type ConnectKnownOrNewDeviceKnownDevice,
} from "./types";

const bleTransport = "RN_BLE" as TransportIdentifier;
const usbTransport = "RN_HID" as TransportIdentifier;
const mockTransport = "MOCK_SERVER" as TransportIdentifier;

const knownNanoX: ConnectKnownOrNewDeviceKnownDevice = {
  transport: bleTransport,
  deviceModelId: DeviceModelId.nanoX,
  id: "nano-x-id",
  name: "My Nano X",
};

const knownStax: ConnectKnownOrNewDeviceKnownDevice = {
  transport: bleTransport,
  deviceModelId: DeviceModelId.stax,
  id: "stax-id",
  name: "My Stax",
};

const knownUsbFlex: ConnectKnownOrNewDeviceKnownDevice = {
  transport: usbTransport,
  deviceModelId: DeviceModelId.europa,
  id: "flex-usb-id",
  name: "My Flex",
};

const discovered = (
  transport: TransportIdentifier,
  id: string,
  model: DMKDeviceModelId = DMKDeviceModelId.NANO_X,
): DiscoveredDevice =>
  ({
    id,
    name: `${id} name`,
    deviceModel: { id: model, model, name: model },
    transport,
  }) as DiscoveredDevice;

const connected = (
  transport: TransportIdentifier,
  id: string,
  overrides: Partial<ConnectedDevice> = {},
): ConnectedDevice =>
  ({
    id,
    sessionId: `${id}-session`,
    modelId: DMKDeviceModelId.NANO_X,
    name: `${id} name`,
    type: transport === usbTransport ? "USB" : "BLE",
    transport,
    ...overrides,
  }) as ConnectedDevice;

const findMatchingDeviceById: ConnectKnownOrNewDeviceFindMatchingDevice = (device, candidates) =>
  candidates.find(
    candidate => candidate.transport === device.transport && candidate.id === device.id,
  ) ?? null;

const build = (input: Partial<BuildDeviceListInput>) =>
  buildDeviceList({
    knownDevices: [],
    connectedDevices: [],
    discoveredDevices: [],
    findMatchingDevice: findMatchingDeviceById,
    getConnectivity: ({ transport }) => (transport === bleTransport ? "BLE" : "USB"),
    getDiscoveredDeviceKey: ({ transport, id }) => `${transport}:${id}`,
    ...input,
  });

const summarize = (input: Partial<BuildDeviceListInput>) =>
  build(input).map(({ key, status, connectivity }) => ({ key, status, connectivity }));

describe("buildDeviceList", () => {
  it("should list a known BLE device that discovery does not find as unavailable", () => {
    expect(build({ knownDevices: [knownNanoX] })).toEqual([
      {
        key: `known:${bleTransport}:nano-x-id`,
        device: knownNanoX,
        connectivity: "BLE",
        status: DeviceListItemStatuses.Unavailable,
        knownDevice: knownNanoX,
        connectedDevice: null,
        discoveredDevice: null,
      },
    ]);
  });

  it("should list a known BLE device that discovery finds as available, with the known device", () => {
    const discoveredNanoX = discovered(bleTransport, "nano-x-id");

    expect(build({ knownDevices: [knownNanoX], discoveredDevices: [discoveredNanoX] })).toEqual([
      {
        key: `known:${bleTransport}:nano-x-id`,
        device: knownNanoX,
        connectivity: "BLE",
        status: DeviceListItemStatuses.Available,
        knownDevice: knownNanoX,
        connectedDevice: null,
        discoveredDevice: discoveredNanoX,
      },
    ]);
  });

  it("should not list a discovered BLE device that is not known", () => {
    expect(build({ discoveredDevices: [discovered(bleTransport, "unknown-id")] })).toEqual([]);
  });

  it("should list a discovered USB device that is not known as available", () => {
    const discoveredFlex = discovered(usbTransport, "flex-usb-id", DMKDeviceModelId.FLEX);

    expect(build({ discoveredDevices: [discoveredFlex] })).toEqual([
      {
        key: `discovered:${usbTransport}:flex-usb-id`,
        device: {
          transport: usbTransport,
          deviceModelId: DeviceModelId.europa,
          id: "flex-usb-id",
          name: "flex-usb-id name",
        },
        connectivity: "USB",
        status: DeviceListItemStatuses.Available,
        knownDevice: null,
        connectedDevice: null,
        discoveredDevice: discoveredFlex,
      },
    ]);
  });

  it("should not list a known USB device that discovery does not find", () => {
    expect(build({ knownDevices: [knownUsbFlex] })).toEqual([]);
  });

  it("should list a connected known device as connected, with the known device", () => {
    const connectedNanoX = connected(bleTransport, "nano-x-id");

    expect(build({ knownDevices: [knownNanoX], connectedDevices: [connectedNanoX] })).toEqual([
      {
        key: `known:${bleTransport}:nano-x-id`,
        device: knownNanoX,
        connectivity: "BLE",
        status: DeviceListItemStatuses.Connected,
        knownDevice: knownNanoX,
        connectedDevice: connectedNanoX,
        discoveredDevice: null,
      },
    ]);
  });

  it("should list a connected device that is not known as connected, keyed by its session", () => {
    expect(summarize({ connectedDevices: [connected(bleTransport, "unknown-id")] })).toEqual([
      {
        key: "connected:unknown-id-session",
        status: DeviceListItemStatuses.Connected,
        connectivity: "BLE",
      },
    ]);
  });

  it("should list every connected device when several devices are connected", () => {
    expect(
      summarize({
        knownDevices: [knownNanoX],
        connectedDevices: [
          connected(bleTransport, "nano-x-id"),
          connected(usbTransport, "unknown-usb-id"),
        ],
      }).map(({ key }) => key),
    ).toEqual([`known:${bleTransport}:nano-x-id`, "connected:unknown-usb-id-session"]);
  });

  it("should list a discovered device that matches a connected device once, as connected", () => {
    expect(
      summarize({
        knownDevices: [knownNanoX],
        connectedDevices: [connected(bleTransport, "nano-x-id")],
        discoveredDevices: [discovered(bleTransport, "nano-x-id")],
      }),
    ).toEqual([
      {
        key: `known:${bleTransport}:nano-x-id`,
        status: DeviceListItemStatuses.Connected,
        connectivity: "BLE",
      },
    ]);
  });

  it("should list a known device in one row when two discovered devices match it", () => {
    const findMatchingDeviceByModel: ConnectKnownOrNewDeviceFindMatchingDevice = (
      device,
      candidates,
    ) =>
      candidates.find(
        candidate =>
          candidate.transport === device.transport &&
          candidate.deviceModelId === device.deviceModelId,
      ) ?? null;

    expect(
      summarize({
        knownDevices: [knownNanoX],
        discoveredDevices: [
          discovered(bleTransport, "nano-x-id"),
          discovered(bleTransport, "nano-x-new-address"),
        ],
        findMatchingDevice: findMatchingDeviceByModel,
      }),
    ).toEqual([
      {
        key: `known:${bleTransport}:nano-x-id`,
        status: DeviceListItemStatuses.Available,
        connectivity: "BLE",
      },
    ]);
  });

  it("should take the connectivity of a connected device from its connection type", () => {
    const getConnectivity = jest.fn().mockReturnValue("BLE");

    expect(
      summarize({
        connectedDevices: [connected(usbTransport, "usb-id")],
        getConnectivity,
      })[0].connectivity,
    ).toBe("USB");
    expect(getConnectivity).not.toHaveBeenCalled();
  });

  it("should take the connectivity of a connected mock device from getConnectivity", () => {
    expect(
      summarize({
        connectedDevices: [connected(mockTransport, "mock-id", { type: "MOCK" })],
        getConnectivity: () => "USB",
      })[0].connectivity,
    ).toBe("USB");
  });

  it("should list a discovered mock device that is not known when getConnectivity gives USB", () => {
    expect(
      summarize({
        discoveredDevices: [
          discovered(mockTransport, "mock-usb-id"),
          discovered(mockTransport, "mock-ble-id"),
        ],
        getConnectivity: ({ id }) => (id === "mock-usb-id" ? "USB" : "BLE"),
      }),
    ).toEqual([
      {
        key: `discovered:${mockTransport}:mock-usb-id`,
        status: DeviceListItemStatuses.Available,
        connectivity: "USB",
      },
    ]);
  });

  it("should list a known mock device as unavailable when getConnectivity gives BLE", () => {
    const knownMockDevice = { ...knownNanoX, transport: mockTransport, id: "mock-ble-id" };

    expect(summarize({ knownDevices: [knownMockDevice], getConnectivity: () => "BLE" })).toEqual([
      {
        key: `known:${mockTransport}:mock-ble-id`,
        status: DeviceListItemStatuses.Unavailable,
        connectivity: "BLE",
      },
    ]);
  });

  it("should order the devices connected, then available, then unavailable", () => {
    expect(
      summarize({
        knownDevices: [knownStax, knownNanoX],
        connectedDevices: [connected(usbTransport, "usb-id")],
        discoveredDevices: [discovered(bleTransport, "nano-x-id")],
      }).map(({ status }) => status),
    ).toEqual([
      DeviceListItemStatuses.Connected,
      DeviceListItemStatuses.Available,
      DeviceListItemStatuses.Unavailable,
    ]);
  });

  it("should put the last used device first in each status group", () => {
    expect(
      summarize({
        knownDevices: [
          { ...knownNanoX, lastUsedAt: 100 },
          { ...knownStax, lastUsedAt: 300 },
          { ...knownNanoX, id: "other-nano-x-id", lastUsedAt: 200 },
        ],
      }).map(({ key }) => key),
    ).toEqual([
      `known:${bleTransport}:stax-id`,
      `known:${bleTransport}:other-nano-x-id`,
      `known:${bleTransport}:nano-x-id`,
    ]);
  });

  it("should put the devices without a last use time after the others, in their order", () => {
    expect(
      summarize({
        knownDevices: [knownNanoX, { ...knownStax, lastUsedAt: 300 }],
        discoveredDevices: [
          discovered(usbTransport, "first-usb-id"),
          discovered(bleTransport, "stax-id"),
          discovered(bleTransport, "nano-x-id"),
          discovered(usbTransport, "second-usb-id"),
        ],
      }).map(({ key }) => key),
    ).toEqual([
      `known:${bleTransport}:stax-id`,
      `discovered:${usbTransport}:first-usb-id`,
      `known:${bleTransport}:nano-x-id`,
      `discovered:${usbTransport}:second-usb-id`,
    ]);
  });
});
