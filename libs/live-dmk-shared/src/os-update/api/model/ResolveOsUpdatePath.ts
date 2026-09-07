import type { DeviceManagementKit, DeviceSessionId } from "@ledgerhq/device-management-kit";

export type ResolveOsUpdatePathUseCaseInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  unlockTimeout?: number;
};
