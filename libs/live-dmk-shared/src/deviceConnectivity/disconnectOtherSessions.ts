import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { log } from "@ledgerhq/logs";

const LOG_TYPE = "disconnectOtherSessions";

/**
 * Ledger Wallet keeps one DMK session at a time: call this right before `dmk.connect`. It starts
 * the disconnection of the other devices' sessions without waiting for it, so a slow or failed
 * disconnection never delays or fails the connection. The sessions of the device to connect stay
 * open, because their disconnection could close the new connection.
 */
export function disconnectOtherSessions(
  dmk: DeviceManagementKit,
  deviceToConnect: Pick<DiscoveredDevice, "id" | "transport">,
): void {
  for (const { sessionId, id, transport } of dmk.listConnectedDevices()) {
    const isDeviceToConnect = id === deviceToConnect.id && transport === deviceToConnect.transport;
    if (!isDeviceToConnect) {
      dmk.disconnect({ sessionId }).catch(error => {
        log(LOG_TYPE, "failed to disconnect a session before a connection", { sessionId, error });
      });
    }
  }
}
