import type { DiscoveredDevice, TransportIdentifier } from "@ledgerhq/device-management-kit";
import type { DeviceModelId } from "@ledgerhq/types-devices";

import {
  ConnectNewDeviceStateMachineEventTypes,
  type ConnectNewDeviceStateMachineEvent,
  type ListedDevice,
  type SelectableDevice,
} from "./types";
import { dmkToLedgerDeviceIdMap } from "../config/dmkToLedgerDeviceIdMap";
import type { BaseDiscoveryError, Device } from "../deviceConnectivity/types";

export const toDevice = (discoveredDevice: DiscoveredDevice): Device => ({
  transport: discoveredDevice.transport,
  deviceModelId: dmkToLedgerDeviceIdMap[discoveredDevice.deviceModel.model],
  id: discoveredDevice.id,
  name: discoveredDevice.name,
});

export const filterListedDevicesByAcceptedModels = (
  listedDevices: Array<ListedDevice>,
  acceptedDeviceModelIds: Array<DeviceModelId> = [],
): Array<ListedDevice> => {
  if (acceptedDeviceModelIds.length === 0) {
    return listedDevices;
  }

  const acceptedModels = new Set(acceptedDeviceModelIds);
  return listedDevices.filter(({ discoveredDevice }) =>
    acceptedModels.has(dmkToLedgerDeviceIdMap[discoveredDevice.deviceModel.model]),
  );
};

export const getScanningTransports = (
  transportIds: Array<TransportIdentifier>,
  ignoredTransportIds: Array<TransportIdentifier>,
): Array<TransportIdentifier> => {
  const ignored = new Set(ignoredTransportIds);
  return transportIds.filter(transportId => !ignored.has(transportId));
};

export const buildSelectableDevices = <
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
>(
  listedDevices: Array<ListedDevice>,
  send: (event: ConnectNewDeviceStateMachineEvent<TDiscoveryError>) => void,
): Array<SelectableDevice> =>
  listedDevices.map(({ key, discoveredDevice, isAvailable }) =>
    isAvailable
      ? {
          key,
          device: toDevice(discoveredDevice),
          isAvailable,
          onSelect: () =>
            send({ type: ConnectNewDeviceStateMachineEventTypes.UserTapsDevice, discoveredDevice }),
        }
      : { key, device: toDevice(discoveredDevice), isAvailable },
  );
