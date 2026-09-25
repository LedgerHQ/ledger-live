import type { DeviceOnboardingContext, OnboardingEvent } from "@ledgerhq/device-onboarding";
import type { DevToolsConfig } from "@devtools/shell";

export type DeviceOnboardingToolProps = Extract<
  DevToolsConfig[number],
  { id: "device-onboarding" }
>["config"];

type ToolContext = NonNullable<DeviceOnboardingToolProps["context"]>;
type ToolEvent = DeviceOnboardingToolProps["events"][number];

export const userEvents = [
  { type: "START" },
  { type: "RETRY" },
  { type: "SKIP" },
  { type: "CLOSE" },
  { type: "QUIT" },
  { type: "CONTINUE" },
  { type: "USER_ACCEPT" },
  { type: "USER_DECLINE" },
] as const satisfies readonly OnboardingEvent[];

export function flattenDeviceOnboardingContext(context: DeviceOnboardingContext): ToolContext {
  const verdict = context.genuineVerdict;

  return {
    deviceModelId: context.deviceModelId,
    offerSync: context.offerSync,
    isOnboarded: context.isOnboarded,
    onboardedOnEntry: context.onboardedOnEntry,
    isInRecoveryMode: context.lastDeviceState?.isInRecoveryMode ?? null,
    managerAllowed: context.lastDeviceState?.managerAllowed ?? null,
    currentOnboardingStep: context.lastDeviceState?.currentOnboardingStep ?? null,
    currentSetupStep: context.currentSetupStep,
    firmwareVersion: context.firmwareVersion,
    availableFirmwareVersion: context.availableFirmwareUpdate?.finalFirmware.version ?? null,
    firmwareChecked: context.firmwareChecked,
    onEarlyCheckScreen: context.onEarlyCheckScreen,
    secureConnectionRequested: context.secureConnectionRequested,
    isGenuine: verdict?.isGenuine ?? null,
    verdictMatchesSession:
      verdict === null ? null : verdict.sessionId === context.ports.currentSessionId(),
    genuineFailureKind: context.lastGenuineFailure?.kind ?? null,
    checksPaused: context.checksPaused,
  };
}

export function stateValueToString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || typeof value !== "object") {
    return String(value);
  }

  return Object.entries(value)
    .map(([key, child]) => {
      const suffix = stateValueToString(child);
      return suffix ? `${key}.${suffix}` : key;
    })
    .join(",");
}

export function toolEvent(event: OnboardingEvent, id: string, sessionId: string): ToolEvent {
  let detail: ToolEvent["detail"];

  if (event.type === "STEP_CHANGED") {
    detail = { kind: "step", step: event.state.currentOnboardingStep };
  } else if (event.type === "FIRMWARE_UPDATE_AVAILABLE") {
    detail = { kind: "firmware", version: event.update.finalFirmware.version };
  } else if (event.type === "SESSION_READY" || event.type === "TRANSPORT_LOST") {
    detail = { kind: "session", sessionId };
  }

  return { id, type: event.type, at: Date.now(), detail };
}
