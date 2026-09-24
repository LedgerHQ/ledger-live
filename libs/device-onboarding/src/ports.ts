import type {
  DeviceManagementKit,
  DeviceModelId,
  DeviceSessionId,
} from "@ledgerhq/device-management-kit";

export type DeviceOnboardingSession = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  deviceModelId: DeviceModelId;
};

/** The app calls `openSession` and `closeSession`; the machine only ever reads the current id. */
export type DeviceOnboardingPorts = {
  openSession(): Promise<DeviceOnboardingSession>;
  currentSessionId(): DeviceSessionId;
  closeSession(): Promise<void>;
};
