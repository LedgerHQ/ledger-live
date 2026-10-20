import type { ConnectedDevice, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { activeDeviceSessionSubject as activeBleDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { activeDeviceSessionSubject as activeHidDeviceSessionSubject } from "../transport/DeviceManagementKitHIDTransport";

type ActiveConnectedDeviceParams = {
  wired: boolean;
};

export function getActiveConnectedDevice(
  dmk: DeviceManagementKit,
  { wired }: ActiveConnectedDeviceParams,
): ConnectedDevice | undefined {
  const sessionId = wired
    ? activeHidDeviceSessionSubject.value?.transport.sessionId
    : activeBleDeviceSessionSubject.value?.sessionId;
  if (!sessionId) return undefined;

  try {
    return dmk.getConnectedDevice({ sessionId });
  } catch {
    return undefined;
  }
}
