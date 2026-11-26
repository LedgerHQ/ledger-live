import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { log } from "@ledgerhq/logs";

import type { IsMatchingConnectedDevice } from "./types";

const LOG_TYPE = "disconnectOtherSessions";

export const isSameDeviceByIdAndTransport: IsMatchingConnectedDevice = (
  connectedDevice,
  discoveredDevice,
) =>
  connectedDevice.id === discoveredDevice.id &&
  connectedDevice.transport === discoveredDevice.transport;

/**
 * Ledger Wallet keeps one DMK session at a time: call this right before `dmk.connect`. It starts
 * the disconnection of the other devices' sessions without waiting for it, so a slow or failed
 * disconnection never delays or fails the connection. The sessions of the device to connect stay
 * open, because their disconnection could close the new connection.
 */
export function disconnectOtherSessions(
  dmk: DeviceManagementKit,
  deviceToConnect: DiscoveredDevice,
  isMatchingConnectedDevice: IsMatchingConnectedDevice = isSameDeviceByIdAndTransport,
): void {
  for (const connectedDevice of dmk.listConnectedDevices()) {
    const isDeviceToConnect = isMatchingConnectedDevice(connectedDevice, deviceToConnect);
    if (!isDeviceToConnect) {
      const { sessionId } = connectedDevice;
      dmk.disconnect({ sessionId }).catch(error => {
        log(LOG_TYPE, "failed to disconnect a session before a connection", { sessionId, error });
      });
    }
  }
}
