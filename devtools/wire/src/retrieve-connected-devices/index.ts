import {
  createRetrieveConnectedDevicesProtocol,
  type Device,
  type RetrieveConnectedDevicesMessages,
} from "@devtools/protocols/retrieve-connected-devices";
import type { TransportProtocol } from "@devtools/transport";

export type { Device };

export function buildRetrieveConnectedDevicesProtocol(
  setDevices: (devices: Device[]) => void,
): TransportProtocol<RetrieveConnectedDevicesMessages> {
  return createRetrieveConnectedDevicesProtocol({ setDevices });
}
