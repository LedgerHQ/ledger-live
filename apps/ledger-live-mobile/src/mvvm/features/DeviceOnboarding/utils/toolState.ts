import type { DevToolsConfig } from "@devtools/shell";

export type DeviceOnboardingToolProps = Extract<
  DevToolsConfig[number],
  { id: "device-onboarding" }
>["config"];

export { stateValueToString, toolEvent, userEvents } from "@ledgerhq/device-onboarding";
