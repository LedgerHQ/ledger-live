import type { ConnectedDevice, DiscoveredDevice } from "@ledgerhq/device-management-kit";

import {
  DeviceListItemStatuses,
  type ConnectKnownOrNewDeviceFindMatchingDevice,
  type ConnectKnownOrNewDeviceGetConnectivity,
  type ConnectKnownOrNewDeviceKnownDevice,
  type DeviceConnectivity,
  type DeviceListEntry,
  type DeviceListItemStatus,
} from "./types";
import { dmkToLedgerDeviceIdMap } from "../config/dmkToLedgerDeviceIdMap";
import type { ConnectNewDeviceGetDiscoveredDeviceKey } from "../connectNewDevice/types";
import { toDevice } from "../connectNewDevice/utils";
import type { Device } from "../deviceConnectivity/types";

export type BuildDeviceListInput = {
  knownDevices: Array<ConnectKnownOrNewDeviceKnownDevice>;
  connectedDevices: Array<ConnectedDevice>;
  discoveredDevices: Array<DiscoveredDevice>;
  findMatchingDevice: ConnectKnownOrNewDeviceFindMatchingDevice;
  getConnectivity: ConnectKnownOrNewDeviceGetConnectivity;
  getDiscoveredDeviceKey: ConnectNewDeviceGetDiscoveredDeviceKey;
};

const STATUS_ORDER: Record<DeviceListItemStatus, number> = {
  [DeviceListItemStatuses.Connected]: 0,
  [DeviceListItemStatuses.Available]: 1,
  [DeviceListItemStatuses.Unavailable]: 2,
};

const toListedDevice = ({ transport, deviceModelId, id, name }: Device): Device => ({
  transport,
  deviceModelId,
  id,
  name,
});

export const connectedDeviceToDevice = (connectedDevice: ConnectedDevice): Device => ({
  transport: connectedDevice.transport,
  deviceModelId: dmkToLedgerDeviceIdMap[connectedDevice.modelId],
  id: connectedDevice.id,
  name: connectedDevice.name,
});

const isDeviceConnectivity = (
  connectionType: ConnectedDevice["type"],
): connectionType is DeviceConnectivity => connectionType === "BLE" || connectionType === "USB";

const getKnownDeviceKey = ({ transport, id }: Device): string => `known:${transport}:${id}`;

const getLastUsedAt = ({ knownDevice }: DeviceListEntry): number => knownDevice?.lastUsedAt ?? 0;

const compareEntries = (a: DeviceListEntry, b: DeviceListEntry): number =>
  STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || getLastUsedAt(b) - getLastUsedAt(a);

export function buildDeviceList({
  knownDevices,
  connectedDevices,
  discoveredDevices,
  findMatchingDevice,
  getConnectivity,
  getDiscoveredDeviceKey,
}: BuildDeviceListInput): Array<DeviceListEntry> {
  const listedKnownDevices = new Set<ConnectKnownOrNewDeviceKnownDevice>();
  const claimKnownDevice = (device: Device): ConnectKnownOrNewDeviceKnownDevice | null => {
    const unlistedKnownDevices = knownDevices.filter(
      knownDevice => !listedKnownDevices.has(knownDevice),
    );
    const knownDevice = findMatchingDevice(device, unlistedKnownDevices);
    if (knownDevice) {
      listedKnownDevices.add(knownDevice);
    }
    return knownDevice;
  };

  const connectedDeviceShapes = connectedDevices.map(connectedDeviceToDevice);

  const connectedEntries = connectedDevices.map((connectedDevice, index): DeviceListEntry => {
    const device = connectedDeviceShapes[index];
    const knownDevice = claimKnownDevice(device);
    return {
      key: knownDevice ? getKnownDeviceKey(knownDevice) : `connected:${connectedDevice.sessionId}`,
      device: toListedDevice(knownDevice ?? device),
      connectivity: isDeviceConnectivity(connectedDevice.type)
        ? connectedDevice.type
        : getConnectivity(device),
      status: DeviceListItemStatuses.Connected,
      knownDevice,
      connectedDevice,
      discoveredDevice: null,
    };
  });

  const availableEntries = discoveredDevices.flatMap((discoveredDevice): Array<DeviceListEntry> => {
    const device = toDevice(discoveredDevice);
    const isListedAsConnected = findMatchingDevice(device, connectedDeviceShapes) !== null;
    if (isListedAsConnected) {
      return [];
    }
    const connectivity = getConnectivity(device);
    const knownDevice = claimKnownDevice(device);
    if (!knownDevice && connectivity !== "USB") {
      return [];
    }
    return [
      {
        key: knownDevice
          ? getKnownDeviceKey(knownDevice)
          : `discovered:${getDiscoveredDeviceKey(discoveredDevice)}`,
        device: toListedDevice(knownDevice ?? device),
        connectivity,
        status: DeviceListItemStatuses.Available,
        knownDevice,
        connectedDevice: null,
        discoveredDevice,
      },
    ];
  });

  const unavailableEntries = knownDevices.flatMap((knownDevice): Array<DeviceListEntry> => {
    if (listedKnownDevices.has(knownDevice) || getConnectivity(knownDevice) !== "BLE") {
      return [];
    }
    return [
      {
        key: getKnownDeviceKey(knownDevice),
        device: toListedDevice(knownDevice),
        connectivity: "BLE",
        status: DeviceListItemStatuses.Unavailable,
        knownDevice,
        connectedDevice: null,
        discoveredDevice: null,
      },
    ];
  });

  return [...connectedEntries, ...availableEntries, ...unavailableEntries].sort(compareEntries);
}
