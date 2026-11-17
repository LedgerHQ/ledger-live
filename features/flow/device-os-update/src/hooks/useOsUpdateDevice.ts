import type { ConnectedDevice } from "@ledgerhq/device-management-kit";
import { useOsUpdatePorts } from "./OsUpdatePortsProvider";
import type { OsUpdateDeviceModel } from "../types/OsUpdateDeviceModel";

export type OsUpdateDeviceView = OsUpdateDeviceModel & Readonly<{ deviceName: string }>;

/** What the flow shows of the connected device: its name, product name, animation and icon. */
export function useOsUpdateDevice(connectedDevice: ConnectedDevice): OsUpdateDeviceView {
  const { getDeviceModel } = useOsUpdatePorts();
  return { ...getDeviceModel(connectedDevice.modelId), deviceName: connectedDevice.name };
}
