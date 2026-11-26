import type { ConnectedDevice, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import type { IsMatchingConnectedDevice } from "@ledgerhq/live-dmk-shared";

const MODEL_MATCHED_TRANSPORTS = new Set<string>([rnHidTransportIdentifier, speculosIdentifier]);

export const isMatchingConnectedDevice: IsMatchingConnectedDevice = (
  connectedDevice: ConnectedDevice,
  discoveredDevice: DiscoveredDevice,
): boolean => {
  if (connectedDevice.transport !== discoveredDevice.transport) {
    return false;
  }

  if (MODEL_MATCHED_TRANSPORTS.has(connectedDevice.transport)) {
    return connectedDevice.modelId === discoveredDevice.deviceModel.model;
  }

  return connectedDevice.id === discoveredDevice.id;
};
