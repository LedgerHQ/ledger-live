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
  const listedKeys = new Set(listedDevices.map(({ key }) => key));

  const updatedListedDevices = listedDevices.map(({ key, discoveredDevice }): ListedDevice => {
    const latestDiscoveredDevice = discoveredDevicesByKey.get(key);
    return latestDiscoveredDevice
      ? { key, discoveredDevice: latestDiscoveredDevice, isAvailable: true }
      : { key, discoveredDevice, isAvailable: false };
  });
  const newListedDevices = [...discoveredDevicesByKey]
    .filter(([key]) => !listedKeys.has(key))
    .map(([key, discoveredDevice]): ListedDevice => ({ key, discoveredDevice, isAvailable: true }));

  return [...updatedListedDevices, ...newListedDevices];
};
