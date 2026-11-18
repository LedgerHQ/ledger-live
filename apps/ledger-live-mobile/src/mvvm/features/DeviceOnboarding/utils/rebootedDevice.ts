import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { findMatchingNewDevice } from "@ledgerhq/live-dmk-mobile";

// The OS update reboot changes the BLE address, the advertised name and the USB id.
export function isRebootedDevice(before: Device, after: Device): boolean {
  if (before.modelId !== after.modelId) return false;
  if (before.wired && after.wired) return true;
  return findMatchingNewDevice(before, [after]) !== null;
}
