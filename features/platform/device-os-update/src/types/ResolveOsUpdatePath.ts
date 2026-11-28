import type { DeviceManagementKit, DeviceSessionId } from "@ledgerhq/device-management-kit";

export type ResolveOsUpdatePathInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  unlockTimeout?: number;
};
