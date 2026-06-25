import {
  PairingRefusedError,
  rnBleTransportIdentifier,
} from "@ledgerhq/device-transport-kit-react-native-ble";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import type { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import {
  dmkToLedgerDeviceIdMap,
  type KnownDevice,
  type MatchedDevice,
} from "@ledgerhq/live-dmk-shared";
import { isPeerRemovedPairingError } from "../errors";
import { PeerRemovedPairing } from "@ledgerhq/errors";
import { BaseConnectionErrorTypes, ConnectionErrorTypes, MobileConnectionError } from "./types";
import { findMatchingNewDevice } from "../utils/matchDevicesByNameOrId";

export const filterMatchedDevices = (
  discoveredDevices: DiscoveredDevice[],
  knownDevices: KnownDevice[],
): MatchedDevice[] => {
  return discoveredDevices
    .map(device => {
      const matchedDevice = knownDevices.find(knownDevice => {
        if (device.transport !== knownDevice.transport) {
          return false;
        }

        if (knownDevice.transport === rnHidTransportIdentifier) {
          return dmkToLedgerDeviceIdMap[device.deviceModel.model] === knownDevice.deviceModelId;
        }

        if (knownDevice.transport === rnBleTransportIdentifier) {
          const oldDevice = {
            deviceId: knownDevice.id,
            deviceName: knownDevice.name,
            modelId: knownDevice.deviceModelId,
          };
          const newDevice = {
            deviceId: device.id,
            deviceName: device.name,
            modelId: dmkToLedgerDeviceIdMap[device.deviceModel.model],
          };

          return findMatchingNewDevice(oldDevice, [newDevice]) !== null;
        }
      });

      return matchedDevice ? { knownDevice: matchedDevice, discoveredDevice: device } : null;
    })
    .filter((matchedDevice): matchedDevice is MatchedDevice => matchedDevice !== null);
};

export const createConnectionError = (error: unknown): MobileConnectionError => {
  if (error instanceof PairingRefusedError) {
    return {
      type: ConnectionErrorTypes.BlePairingRefused,
    };
  }

  if (error instanceof PeerRemovedPairing || isPeerRemovedPairingError(error)) {
    return {
      type: ConnectionErrorTypes.BlePairingPeerRemovedPairing,
    };
  }

  return {
    type: BaseConnectionErrorTypes.Unknown,
    error,
  };
};
