import type { DeviceModelId } from "@ledgerhq/types-devices";

import {
  type BaseDiscoveryError,
  ConnectDeviceStateMachineEventTypes,
  type ConnectDeviceStateMachineEvent,
  type DisplayedDevice,
  type KnownDevice,
  type MatchedDevice,
} from "./types";

export const filterKnownDevicesByAcceptedModels = (
  knownDevices: Array<KnownDevice>,
  acceptedDeviceModelIds: Array<DeviceModelId> = [],
): Array<KnownDevice> => {
  if (acceptedDeviceModelIds.length === 0) {
    return knownDevices;
  }

  const acceptedModels = new Set(acceptedDeviceModelIds);
  return knownDevices.filter(knownDevice => acceptedModels.has(knownDevice.deviceModelId));
};

export const isSameKnownDevice = (deviceA: KnownDevice, deviceB: KnownDevice): boolean =>
  deviceA.id === deviceB.id &&
  deviceA.deviceModelId === deviceB.deviceModelId &&
  deviceA.transport === deviceB.transport;

export const findMatchedDevice = (
  knownDevice: KnownDevice,
  matchedDevices: Array<MatchedDevice>,
): MatchedDevice | null =>
  matchedDevices.find(matchedDevice => isSameKnownDevice(matchedDevice.knownDevice, knownDevice)) ??
  null;

export const getFirstMatchedDeviceFromDiscoveryEvent = <
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
>(
  event: ConnectDeviceStateMachineEvent<TDiscoveryError>,
): MatchedDevice | null => {
  if (event.type !== ConnectDeviceStateMachineEventTypes.DiscoveredOneDevice) {
    return null;
  }
  return event.matchedDevices[0];
};

export const getMatchedDevicesFromDiscoveryEvent = <
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
>(
  event: ConnectDeviceStateMachineEvent<TDiscoveryError>,
): Array<MatchedDevice> => {
  switch (event.type) {
    case ConnectDeviceStateMachineEventTypes.DiscoveredOneDevice:
    case ConnectDeviceStateMachineEventTypes.DiscoveredManyDevices:
      return event.matchedDevices;
    case ConnectDeviceStateMachineEventTypes.DiscoveredNoDevice:
    default:
      return [];
  }
};

export const getSelectedMatchedDeviceFromDiscoveryEvent = <
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
>(
  event: ConnectDeviceStateMachineEvent<TDiscoveryError>,
  selectedKnownDevice: KnownDevice | null,
): MatchedDevice | null => {
  if (selectedKnownDevice === null) {
    return null;
  }

  const matchedDevices = getMatchedDevicesFromDiscoveryEvent(event);
  return findMatchedDevice(selectedKnownDevice, matchedDevices);
};

export const buildDisplayedDevices = <
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
>(
  knownDevices: Array<KnownDevice>,
  matchedDevices: Array<MatchedDevice>,
  send: (event: ConnectDeviceStateMachineEvent<TDiscoveryError>) => void,
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
