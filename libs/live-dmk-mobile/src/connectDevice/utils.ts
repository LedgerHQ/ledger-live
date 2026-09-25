import {
  PairingRefusedError,
  rnBleTransportIdentifier,
} from "@ledgerhq/device-transport-kit-react-native-ble";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import type { ConnectedDevice, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import {
  dmkToLedgerDeviceIdMap,
  type KnownDevice,
  type MatchedDevice,
} from "@ledgerhq/live-dmk-shared";
import { isPeerRemovedPairingError } from "../errors";
import { BaseConnectionErrorTypes, ConnectionErrorTypes, MobileConnectionError } from "./types";
import { findMatchingNewDevice } from "../utils/matchDevicesByNameOrId";
import { buildUsbCompatDeviceId } from "../transport/usbCompatDeviceId";
import {
  buildSpeculosLegacyDeviceId,
  speculosTargetSubject,
} from "../transport/SpeculosDmkTransport";

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

        const matchesByModelOnly =
          knownDevice.transport === rnHidTransportIdentifier ||
          knownDevice.transport === speculosIdentifier;

        if (matchesByModelOnly) {
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

export const buildMobileCompatDeviceId = (device: ConnectedDevice): string => {
  // Speculos reports type USB, but the legacy registry opens it from the e2e URL.
  if (device.transport === speculosIdentifier) {
    const target = speculosTargetSubject.getValue();

    return target ? buildSpeculosLegacyDeviceId(target.url) : device.id;
  }

  if (device.type === "USB") {
    return buildUsbCompatDeviceId(device.id);
  }

  return device.id;
};

export const createConnectionError = (error: unknown): MobileConnectionError => {
  if (error instanceof PairingRefusedError) {
    return {
      type: ConnectionErrorTypes.BlePairingRefused,
    };
  }

  if (
    (error as { name?: string })?.name === "PeerRemovedPairing" ||
    isPeerRemovedPairingError(error)
  ) {
    return {
      type: ConnectionErrorTypes.BlePairingPeerRemovedPairing,
    };
  }

  return {
    type: BaseConnectionErrorTypes.Unknown,
    error,
  };
};
