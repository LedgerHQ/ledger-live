import type {
  ConnectedDevice,
  DeviceManagementKit,
  DeviceSessionId,
} from "@ledgerhq/device-management-kit";
import type { DeviceOnboardingPorts } from "@ledgerhq/device-onboarding";
import {
  activeHidDeviceSessionSubject,
  DeviceManagementKitBLETransport,
  DeviceManagementKitHIDTransport,
} from "@ledgerhq/live-dmk-mobile";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";

type CreateDeviceOnboardingPortsInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  connectedDevice: ConnectedDevice;
  wired: boolean;
};

type MobileDmkTransport =
  | DeviceManagementKitBLETransport
  | DeviceManagementKitHIDTransport;

export function createDeviceOnboardingPorts({
  dmk,
  sessionId,
  connectedDevice: _connectedDevice,
  wired,
}: CreateDeviceOnboardingPortsInput): DeviceOnboardingPorts {
  let heldTransport: MobileDmkTransport | null = null;

  const publishedTransport = (): MobileDmkTransport | null =>
    wired
      ? activeHidDeviceSessionSubject.value?.transport ?? null
      : activeDeviceSessionSubject.value?.transport ?? null;

  const liveTransport = (): MobileDmkTransport | null => publishedTransport() ?? heldTransport;

  return {
    async openSession() {
      const reusableTransport = publishedTransport();
      heldTransport =
        reusableTransport?.sessionId === sessionId
          ? reusableTransport
          : wired
            ? new DeviceManagementKitHIDTransport(dmk, sessionId)
            : new DeviceManagementKitBLETransport(dmk, sessionId);

      if (wired) {
        activeHidDeviceSessionSubject.next({
          transport: heldTransport as DeviceManagementKitHIDTransport,
        });
      } else {
        activeDeviceSessionSubject.next({
          sessionId,
          transport: heldTransport as DeviceManagementKitBLETransport,
        });
      }

      const modelId = dmk.getConnectedDevice({ sessionId }).modelId;
      return { dmk, sessionId, deviceModelId: modelId };
    },
    currentSessionId() {
      return liveTransport()?.sessionId ?? sessionId;
    },
    async closeSession() {
      await heldTransport?.close();
    },
  };
}
