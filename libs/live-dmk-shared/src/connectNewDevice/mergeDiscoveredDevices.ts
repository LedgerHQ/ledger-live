import type { DiscoveredDevice } from "@ledgerhq/device-management-kit";

import type { ConnectNewDeviceGetDiscoveredDeviceKey, ListedDevice } from "./types";

/**
 * Keeps the listed devices in the order of their first discovery and appends the new ones. A listed
 * device that the discovery no longer reports stays at its position and is not available.
 */
export const mergeDiscoveredDevices = (
  listedDevices: ReadonlyArray<ListedDevice>,
  discoveredDevices: ReadonlyArray<DiscoveredDevice>,
  getDiscoveredDeviceKey: ConnectNewDeviceGetDiscoveredDeviceKey,
): Array<ListedDevice> => {
  const discoveredDevicesByKey = new Map(
    discoveredDevices.map(discoveredDevice => [
      getDiscoveredDeviceKey(discoveredDevice),
      discoveredDevice,
    ]),
  );
  const listedKeys = new Set(
    listedDevices.map(({ discoveredDevice }) => getDiscoveredDeviceKey(discoveredDevice)),
  );

  const updatedListedDevices = listedDevices.map(({ discoveredDevice }): ListedDevice => {
    const latestDiscoveredDevice = discoveredDevicesByKey.get(
      getDiscoveredDeviceKey(discoveredDevice),
    );
    return latestDiscoveredDevice
      ? { discoveredDevice: latestDiscoveredDevice, isAvailable: true }
      : { discoveredDevice, isAvailable: false };
  });
  const newListedDevices = [...discoveredDevicesByKey]
    .filter(([key]) => !listedKeys.has(key))
    .map(([, discoveredDevice]): ListedDevice => ({ discoveredDevice, isAvailable: true }));

  return [...updatedListedDevices, ...newListedDevices];
};
