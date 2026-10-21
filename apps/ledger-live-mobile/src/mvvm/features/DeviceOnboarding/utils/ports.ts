import type { DeviceManagementKit, DeviceSessionId } from "@ledgerhq/device-management-kit";
import type { DeviceOnboardingPorts } from "@devtools/bindings";
import {
  activeHidDeviceSessionSubject,
  DeviceManagementKitBLETransport,
  DeviceManagementKitHIDTransport,
} from "@ledgerhq/live-dmk-mobile";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";

type CreateDeviceOnboardingPortsInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  wired: boolean;
};

type MobileDmkTransport = DeviceManagementKitBLETransport | DeviceManagementKitHIDTransport;

/**
 * The last ports to open a transport own it. An older screen can close late (after its early-check
 * Exit), once a newer screen has reused the same session: it must not close it under that screen.
 */
const owners = new WeakMap<MobileDmkTransport, symbol>();

export function createDeviceOnboardingPorts({
  dmk,
  sessionId,
  wired,
}: CreateDeviceOnboardingPortsInput): DeviceOnboardingPorts {
  const owner = Symbol("ports");
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
        heldTransport = wired
          ? new DeviceManagementKitHIDTransport(dmk, sessionId)
          : new DeviceManagementKitBLETransport(dmk, sessionId);
      }

      owners.set(heldTransport, owner);

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
      const closing = heldTransport;
      if (!closing) return;
      heldTransport = null;
      if (owners.get(closing) !== owner) return;
      if (wired) {
        if (activeHidDeviceSessionSubject.value?.transport === closing) {
          activeHidDeviceSessionSubject.next(null);
        }
      } else if (activeDeviceSessionSubject.value?.transport === closing) {
        activeDeviceSessionSubject.next(null);
      }
      await closing.close();
    },
  };
}
