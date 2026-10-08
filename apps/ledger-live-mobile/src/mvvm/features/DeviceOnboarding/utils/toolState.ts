import type { DeviceOnboardingContext, OnboardingEvent } from "@ledgerhq/device-onboarding";
import type { DevToolsConfig } from "@devtools/shell";

export type DeviceOnboardingToolProps = Extract<
  DevToolsConfig[number],
  { id: "device-onboarding" }
>["config"];

type ToolContext = NonNullable<DeviceOnboardingToolProps["context"]>;
type ToolEvent = DeviceOnboardingToolProps["events"][number];

export const userEvents = [
  { type: "CONTINUE" },
  { type: "RETRY" },
  { type: "SKIP" },
  { type: "CLOSE" },
  { type: "QUIT" },
  { type: "USER_ACCEPT" },
  { type: "USER_DECLINE" },
] as const satisfies readonly OnboardingEvent[];

const hiddenPayloadKeys = new Set(["type", "failure", "deviceId", "dmk", "ports"]);

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
    detail = { kind: "firmware", version: event.output.update.finalFirmware.version };
  } else if (event.type === "SESSION_READY" || event.type === "TRANSPORT_LOST") {
    detail = { kind: "session", sessionId };
  }

  return { id, type: event.type, at: Date.now(), detail, payload: eventPayload(event) };
}

function eventPayload(event: OnboardingEvent): ToolEvent["payload"] {
  const payload: Record<string, NonNullable<ToolEvent["payload"]>> = {};

  for (const [key, child] of Object.entries(event)) {
    if (hiddenPayloadKeys.has(key)) continue;
    const copied = plainPayload(child);
    if (copied !== undefined) payload[key] = copied;
  }

  return Object.keys(payload).length === 0 ? undefined : payload;
}

function plainPayload(value: unknown): NonNullable<ToolEvent["payload"]> | undefined {
  if (typeof value === "string") {
    return value.includes("://") ? undefined : value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (value === null || typeof value !== "object") return undefined;

  const nested: Record<string, NonNullable<ToolEvent["payload"]>> = {};
  for (const [key, child] of Object.entries(value)) {
    if (hiddenPayloadKeys.has(key)) continue;
    const copied = plainPayload(child);
    if (copied !== undefined) nested[key] = copied;
  }

  return Object.keys(nested).length === 0 ? undefined : nested;
}
