import type { DeviceOnboardingInput } from "@ledgerhq/device-onboarding";

export type DeviceOnboardingSession = Pick<
  DeviceOnboardingInput,
  "dmk" | "sessionId" | "deviceModelId"
>;

/** The host's adapter to the device session. The machine never sees it: it gets the id as data. */
export type DeviceOnboardingPorts = {
  openSession(): Promise<DeviceOnboardingSession>;
  currentSessionId(): DeviceOnboardingSession["sessionId"];
  closeSession(): Promise<void>;
};
