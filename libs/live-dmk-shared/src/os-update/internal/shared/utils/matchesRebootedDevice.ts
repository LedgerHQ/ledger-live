import type { ConnectedDevice, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { matchDeviceByName } from "./matchDeviceByName";

/**
 * BLE is the only transport whose device id changes across an OS update, and the only one needing
 * name matching to be found again. Hardcoded rather than imported, since the transport packages are
 * platform specific and this library is shared.
 */
const BLE_TRANSPORT_IDENTIFIERS = new Set(["RN_BLE"]);

/**
 * Picks the device that came back from a reboot out of what discovery reports.
 *
 * Neither transport can be matched on the id it was connected under. BLE changes both its address
 * and its default name across an OS update, so the name is what carries over. HID reports the
 * transport's session id as the connected device's id, which is not the uid discovery hands out,
 * and a reboot re-enumerates the device under a new uid anyway, so the model is all that is left.
 */
export const matchesRebootedDevice = (
  connectedDevice: ConnectedDevice,
  candidate: DiscoveredDevice,
): boolean => {
  if (candidate.deviceModel.model !== connectedDevice.modelId) {
    return false;
  }

  if (!BLE_TRANSPORT_IDENTIFIERS.has(connectedDevice.transport)) {
    return true;
  }

  return (
    candidate.id === connectedDevice.id || matchDeviceByName(connectedDevice.name, candidate.name)
  );
};
