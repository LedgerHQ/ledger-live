import { PairingRefusedError } from "@ledgerhq/device-transport-kit-react-native-ble";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import type { ConnectedDevice, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import {
  buildMockServerCompatDeviceId,
  toDevice,
  type KnownDevice,
  type MatchedDevice,
} from "@ledgerhq/live-dmk-shared";
import { isPeerRemovedPairingError } from "../errors";
import {
  BaseConnectionErrorTypes,
  ConnectionErrorTypes,
  type MobileConnectionError,
} from "../deviceConnectivity/types";
import { findMatchingDevice } from "../utils/findMatchingDevice";
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
      const matchedDevice = findMatchingDevice(toDevice(device), knownDevices);

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

  if (device.transport === mockserverIdentifier) {
    return buildMockServerCompatDeviceId(device.id);
  }

  // Only native RN HID devices use the `usb|` prefix in the legacy transport registry;
  // HTTP proxy devices also report `type: "USB"` but already carry their `httpdebug|` id.
  if (device.transport === rnHidTransportIdentifier) {
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
