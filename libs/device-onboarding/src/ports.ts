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

/** The host's adapter to the device session. The machine never sees it: it gets the id as data. */
export type DeviceOnboardingPorts = {
  openSession(): Promise<DeviceOnboardingSession>;
  currentSessionId(): DeviceSessionId;
  closeSession(): Promise<void>;
};
