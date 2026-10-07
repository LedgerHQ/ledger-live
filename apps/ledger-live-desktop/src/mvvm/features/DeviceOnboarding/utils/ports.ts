import type { DeviceOnboardingPorts } from "@ledgerhq/device-onboarding";
import { DeviceManagementKitTransport, getDeviceManagementKit } from "@ledgerhq/live-dmk-desktop";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";

export function createDeviceOnboardingPorts(): DeviceOnboardingPorts {
  let heldTransport: DeviceManagementKitTransport | null = null;

  const liveSessionId = () =>
    activeDeviceSessionSubject.value?.sessionId ?? heldTransport?.sessionId ?? null;

  return {
    async openSession() {
      heldTransport = await DeviceManagementKitTransport.open();
      const sessionId = liveSessionId();
      if (!sessionId) throw new Error("No desktop onboarding session");

      const dmk = getDeviceManagementKit();
      const deviceModelId = dmk.getConnectedDevice({ sessionId }).modelId;
      return { dmk, sessionId, deviceModelId };
    },
    currentSessionId() {
      const sessionId = liveSessionId();
      if (!sessionId) throw new Error("No desktop onboarding session");
      return sessionId;
    },
    async closeSession() {
      await heldTransport?.close();
      heldTransport = null;
    },
  };
}
