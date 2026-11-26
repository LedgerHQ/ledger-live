import type { ConnectedDevice, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import type { IsMatchingConnectedDevice } from "@ledgerhq/live-dmk-shared";

export const isMatchingConnectedDevice: IsMatchingConnectedDevice = (
  connectedDevice: ConnectedDevice,
  discoveredDevice: DiscoveredDevice,
): boolean => {
  if (connectedDevice.transport !== discoveredDevice.transport) {
    return false;
  }

  if (connectedDevice.transport === rnHidTransportIdentifier) {
    return connectedDevice.modelId === discoveredDevice.deviceModel.model;
  }

  return connectedDevice.id === discoveredDevice.id;
};
