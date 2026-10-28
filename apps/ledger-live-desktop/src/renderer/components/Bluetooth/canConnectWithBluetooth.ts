import { getDeviceModel } from "@ledgerhq/devices";
import { isBluetoothTransportEnabled } from "@ledgerhq/live-dmk-desktop";
import type { DeviceModelId } from "@ledgerhq/types-devices";

/**
 * The Bluetooth transport is enabled and at least one of the accepted models supports Bluetooth.
 * An empty list accepts any model, like the device intent `acceptedDeviceModelIds`.
 */
export function canConnectWithBluetooth(acceptedDeviceModelIds: readonly DeviceModelId[]): boolean {
  if (!isBluetoothTransportEnabled()) return false;
  if (acceptedDeviceModelIds.length === 0) return true;
  return acceptedDeviceModelIds.some(deviceModelId =>
    Boolean(getDeviceModel(deviceModelId).bluetoothSpec),
  );
}
