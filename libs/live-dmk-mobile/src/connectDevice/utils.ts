import {
  PairingRefusedError,
  rnBleTransportIdentifier,
} from "@ledgerhq/device-transport-kit-react-native-ble";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import type { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { dmkToLedgerDeviceIdMap, KnownDevice } from "@ledgerhq/live-dmk-shared";
import { isPeerRemovedPairingError } from "../errors";
import { PeerRemovedPairing } from "@ledgerhq/errors";
import {
  ConnectDeviceStateMachineEvent,
  ConnectDeviceStateMachineEventTypes,
  MatchedDevice,
  DisplayedDevice,
  ConnectionError,
  ConnectionErrorTypes,
} from "./types";
import { findMatchingNewDevice } from "../utils/matchDevicesByNameOrId";

export const filterMatchedDevices = (discoveredDevices: DiscoveredDevice[], knownDevices: KnownDevice[]): MatchedDevice[] => {
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

export const isSameKnownDevice = (deviceA: KnownDevice, deviceB: KnownDevice): boolean =>
  deviceA.id === deviceB.id && deviceA.deviceModelId === deviceB.deviceModelId;

export const findMatchedDevice = (
  knownDevice: KnownDevice,
  matchedDevices: Array<MatchedDevice>,
): MatchedDevice | null =>
  matchedDevices.find(matchedDevice => isSameKnownDevice(matchedDevice.knownDevice, knownDevice)) ??
  null;

export const getFirstMatchedDeviceFromDiscoveryEvent = (
  event: ConnectDeviceStateMachineEvent,
): MatchedDevice | null => {
  if (event.type !== ConnectDeviceStateMachineEventTypes.DiscoveredOneDevice) {
    return null;
  }
  return event.matchedDevices[0];
};

export const getMatchedDevicesFromDiscoveryEvent = (
  event: ConnectDeviceStateMachineEvent,
): Array<MatchedDevice> => {
  switch (event.type) {
    case ConnectDeviceStateMachineEventTypes.DiscoveredOneDevice:
    case ConnectDeviceStateMachineEventTypes.DiscoveredManyDevices:
      return event.matchedDevices;
    case ConnectDeviceStateMachineEventTypes.DiscoveredNoDevice:
      return [];
    default:
      return [];
  }
};

export const getSelectedMatchedDeviceFromDiscoveryEvent = (
  event: ConnectDeviceStateMachineEvent,
  selectedKnownDevice: KnownDevice | null,
): MatchedDevice | null => {
  if (selectedKnownDevice === null) {
    return null;
  }

  const matchedDevices = getMatchedDevicesFromDiscoveryEvent(event);
  return findMatchedDevice(selectedKnownDevice, matchedDevices);
};

export const buildDisplayedDevices = (
  knownDevices: Array<KnownDevice>,
  matchedDevices: Array<MatchedDevice>,
  send: (event: ConnectDeviceStateMachineEvent) => void,
): Array<DisplayedDevice> =>
  knownDevices.map(knownDevice => {
    const matchedDevice = findMatchedDevice(knownDevice, matchedDevices);

    if (matchedDevice) {
      return {
        type: "available",
        knownDevice,
        onSelect: () =>
          send({
            type: ConnectDeviceStateMachineEventTypes.UserTapsAvailableDevice,
            matchedDevice,
          }),
      };
    }

    return {
      type: "not-available",
      knownDevice,
      onSelect: () =>
        send({
          type: ConnectDeviceStateMachineEventTypes.UserTapsUnavailableDevice,
          knownDevice,
        }),
    };
  });

export const createConnectionError = (error: unknown): ConnectionError => {
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
    type: ConnectionErrorTypes.Unknown,
    error,
  };
};
