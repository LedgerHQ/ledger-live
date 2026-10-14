import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import type { ConnectNewDeviceGetDiscoveredDeviceKey } from "@ledgerhq/live-dmk-shared";

/**
 * A USB device gets a new id at each discovery. One USB device at a time is supported, so its
 * model identifies it.
 */
export const getDiscoveredDeviceKey: ConnectNewDeviceGetDiscoveredDeviceKey = ({
  transport,
  id,
  deviceModel,
}) => {
  const identifier = transport === rnHidTransportIdentifier ? deviceModel.model : id;
  return `${transport}:${identifier}`;
};
