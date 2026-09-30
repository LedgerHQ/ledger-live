import type { DiscoveredDevice, TransportIdentifier } from "@ledgerhq/device-management-kit";

import {
  ConnectNewDeviceStateMachineEventTypes,
  type ConnectNewDeviceStateMachineEvent,
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

export const getScanningTransports = (
  transportIds: Array<TransportIdentifier>,
  skipTransportIds: Array<TransportIdentifier>,
): Array<TransportIdentifier> => {
  const skippedTransportIds = new Set(skipTransportIds);
  return transportIds.filter(transportId => !skippedTransportIds.has(transportId));
};

export const buildSelectableDevices = <
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
>(
  discoveredDevices: Array<DiscoveredDevice>,
  send: (event: ConnectNewDeviceStateMachineEvent<TDiscoveryError>) => void,
): Array<SelectableDevice> =>
  discoveredDevices.map(discoveredDevice => ({
    device: toDevice(discoveredDevice),
    onSelect: () =>
      send({ type: ConnectNewDeviceStateMachineEventTypes.UserTapsDevice, discoveredDevice }),
  }));
