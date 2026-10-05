import type { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import { webHidIdentifier as webHidTransportIdentifier } from "@ledgerhq/device-transport-kit-web-hid";
import {
  dmkToLedgerDeviceIdMap,
  type KnownDevice,
  type MatchedDevice,
} from "@ledgerhq/live-dmk-shared";

import { BaseConnectionErrorTypes, type DesktopConnectionError } from "./types";

export const filterMatchedDevices = (
  discoveredDevices: DiscoveredDevice[],
  knownDevices: KnownDevice[],
): MatchedDevice[] => {
  return discoveredDevices
    .map(device => {
      if (
        device.transport !== webHidTransportIdentifier &&
        device.transport !== speculosIdentifier
      ) {
        return null;
      }

      const matchedDevice = knownDevices.find(knownDevice => {
        if (device.transport !== knownDevice.transport) {
          return false;
        }

        return dmkToLedgerDeviceIdMap[device.deviceModel.model] === knownDevice.deviceModelId;
      });

      if (!matchedDevice) {
        return null;
      }

      return { knownDevice: matchedDevice, discoveredDevice: device };
    })
    .filter((matchedDevice): matchedDevice is MatchedDevice => matchedDevice !== null);
};

export const createConnectionError = (error: unknown): DesktopConnectionError => ({
  type: BaseConnectionErrorTypes.Unknown,
  error,
});
