import type { DeviceManagementKit, DeviceSessionId } from "@ledgerhq/device-management-kit";
import type { DeviceOnboardingPorts } from "@ledgerhq/device-onboarding";
import {
  activeHidDeviceSessionSubject,
  DeviceManagementKitBLETransport,
  DeviceManagementKitHIDTransport,
} from "@ledgerhq/live-dmk-mobile";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";

export type OnboardingDeviceKit = Pick<
  DeviceManagementKit,
  "getConnectedDevice" | "getDeviceSessionState"
>;

type CreateDeviceOnboardingPortsInput = {
  dmk: OnboardingDeviceKit;
  sessionId: DeviceSessionId;
  wired: boolean;
};

type MobileDmkTransport = DeviceManagementKitBLETransport | DeviceManagementKitHIDTransport;

export function openOnboardingTransport(
  dmk: OnboardingDeviceKit,
  sessionId: DeviceSessionId,
  wired: true,
): DeviceManagementKitHIDTransport;
export function openOnboardingTransport(
  dmk: OnboardingDeviceKit,
  sessionId: DeviceSessionId,
  wired: false,
): DeviceManagementKitBLETransport;
export function openOnboardingTransport(
  dmk: OnboardingDeviceKit,
  sessionId: DeviceSessionId,
  wired: boolean,
): MobileDmkTransport;
export function openOnboardingTransport(
  dmk: OnboardingDeviceKit,
  sessionId: DeviceSessionId,
  wired: boolean,
): MobileDmkTransport {
  const kit = dmk as DeviceManagementKit;

  return wired
    ? new DeviceManagementKitHIDTransport(kit, sessionId)
    : new DeviceManagementKitBLETransport(kit, sessionId);
}

export function createDeviceOnboardingPorts({
  dmk,
  sessionId,
  wired,
}: CreateDeviceOnboardingPortsInput): DeviceOnboardingPorts {
  let heldTransport: MobileDmkTransport | null = null;

  const publishedTransport = (): MobileDmkTransport | null =>
    wired
      ? (activeHidDeviceSessionSubject.value?.transport ?? null)
      : (activeDeviceSessionSubject.value?.transport ?? null);

  const liveTransport = (): MobileDmkTransport | null => publishedTransport() ?? heldTransport;

  return {
    async openSession() {
      const reusableTransport = publishedTransport();
      if (reusableTransport?.sessionId === sessionId) {
        heldTransport = reusableTransport;
      } else {
        heldTransport = openOnboardingTransport(dmk, sessionId, wired);
      }

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
      return { dmk: dmk as DeviceManagementKit, sessionId, deviceModelId: modelId };
    },
    currentSessionId() {
      return liveTransport()?.sessionId ?? sessionId;
    },
    async closeSession() {
      await heldTransport?.close();
    },
  };
}
