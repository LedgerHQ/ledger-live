import type { SnapshotFrom } from "xstate";
import type { deviceOnboardingMachine } from "./machine";
import type { DeviceSessionId } from "@ledgerhq/device-management-kit";
import type {
  DeviceOnboardingContext,
  OnboardingEvent,
  OnboardingStep,
  RecoveryKeyStatus,
} from "./types";

export const userEvents = [
  { type: "CONTINUE" },
  { type: "RETRY" },
  { type: "SKIP" },
  { type: "CLOSE" },
  { type: "QUIT" },
  { type: "USER_ACCEPT" },
  { type: "USER_DECLINE" },
] as const satisfies readonly OnboardingEvent[];

export type WatchedOnboardingContext = {
  deviceModelId: DeviceOnboardingContext["deviceModelId"];
  offerSync: boolean;
  isOnboarded: boolean;
  onboardedOnEntry: boolean | null;
  isInRecoveryMode: boolean | null;
  managerAllowed: boolean | null;
  currentOnboardingStep: OnboardingStep | null;
  recoveryKeyStatus: RecoveryKeyStatus | null;
  currentSetupStep: OnboardingStep | null;
  firmwareVersion: string | null;
  availableFirmwareVersion: string | null;
  firmwareChecked: boolean;
  onEarlyCheckScreen: boolean;
  secureConnectionRequested: boolean;
  isGenuine: boolean | null;
  verdictMatchesSession: boolean | null;
  genuineFailureKind: string | null;
  checksPaused: boolean;
};

function readSessionId(read: () => string | null | undefined): string | null {
  try {
    return read() || null;
  } catch {
    return null;
  }
}

export function flattenDeviceOnboardingContext(
  snapshot: SnapshotFrom<typeof deviceOnboardingMachine>,
): WatchedOnboardingContext {
  const { context } = snapshot;
  const verdict = context.genuineVerdict;
  const firmware = context.firmware;

  return {
    deviceModelId: context.deviceModelId,
    offerSync: context.offerSync,
    isOnboarded: context.isOnboarded,
    onboardedOnEntry: context.onboardedOnEntry,
    isInRecoveryMode: context.lastDeviceState?.isInRecoveryMode ?? null,
    managerAllowed: context.lastDeviceState?.managerAllowed ?? null,
    currentOnboardingStep: context.lastDeviceState?.currentOnboardingStep ?? null,
    recoveryKeyStatus: context.lastDeviceState?.recoveryKeyStatus ?? null,
    currentSetupStep: context.currentSetupStep,
    firmwareVersion: context.firmwareVersion,
    availableFirmwareVersion:
      firmware?.kind === "offered" ? firmware.update.finalFirmware.version : null,
    firmwareChecked: firmware?.kind === "checked",
    onEarlyCheckScreen: context.onEarlyCheckScreen,
    secureConnectionRequested: snapshot.matches({ checks: { genuineCheck: "awaitingApproval" } }),
    isGenuine: verdict?.isGenuine ?? null,
    verdictMatchesSession: verdict === null ? null : verdict.sessionId === context.sessionId,
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

export type HostToolEventDetail =
  | { readonly kind: "step"; readonly step: OnboardingStep }
  | { readonly kind: "firmware"; readonly version: string }
  | { readonly kind: "session"; readonly sessionId: string };

export type HostToolEvent = {
  readonly id: string;
  readonly type: OnboardingEvent["type"];
  readonly at: number;
  readonly detail?: HostToolEventDetail;
};

export function toolEvent(event: OnboardingEvent, id: string, sessionId: string): HostToolEvent {
  let detail: HostToolEventDetail | undefined;

  if (event.type === "STEP_CHANGED") {
    detail = { kind: "step", step: event.state.currentOnboardingStep };
  } else if (event.type === "FIRMWARE_UPDATE_AVAILABLE") {
    detail = { kind: "firmware", version: event.update.finalFirmware.version };
  } else if (
    event.type === "SESSION_READY" ||
    event.type === "SESSION_CHANGED" ||
    event.type === "TRANSPORT_LOST"
  ) {
    detail = { kind: "session", sessionId };
  }

  return { id, type: event.type, at: Date.now(), detail };
}

type SessionEvent = { type: "SESSION_READY" | "SESSION_CHANGED" | "FIRMWARE_UPDATE_FLOW_CLOSED" };

const sessionEventTypes = new Set<string>([
  "SESSION_READY",
  "SESSION_CHANGED",
  "FIRMWARE_UPDATE_FLOW_CLOSED",
]);

/** What a host or the devtool sends. The session events have no id: only the host knows it. */
export type HostOnboardingEvent = Exclude<OnboardingEvent, SessionEvent> | SessionEvent;

function isSessionEvent(event: HostOnboardingEvent): event is SessionEvent {
  return sessionEventTypes.has(event.type);
}

/** Adds the live session id to the session events. `sessionId` is read only for them. */
export function stampSession(
  event: HostOnboardingEvent,
  sessionId: () => DeviceSessionId,
): OnboardingEvent {
  return isSessionEvent(event) ? { type: event.type, sessionId: sessionId() } : event;
}

function loggedStepKey(event: OnboardingEvent): string | null {
  if (event.type !== "STEP_CHANGED") return null;
  return `${event.state.currentOnboardingStep}:${event.state.recoveryKeyStatus ?? ""}`;
}

export function createOnboardingEventLog(deps: {
  currentSessionId: () => string | null | undefined;
  lastLoggedStep: { current: string | null };
  sequence: { current: number };
  push: (entry: HostToolEvent) => void;
}): (event: OnboardingEvent) => void {
  return event => {
    const recorded = recordOnboardingToolEvent(
      event,
      String(deps.sequence.current),
      readSessionId(deps.currentSessionId) ?? "unavailable",
      deps.lastLoggedStep.current,
    );
    deps.lastLoggedStep.current = recorded.step;
    if (!recorded.entry) return;
    deps.sequence.current += 1;
    deps.push(recorded.entry);
  };
}

export function recordOnboardingToolEvent(
  event: OnboardingEvent,
  id: string,
  sessionId: string,
  lastLoggedStep: string | null,
): { step: string | null; entry: HostToolEvent | null } {
  const step = loggedStepKey(event) ?? lastLoggedStep;
  if (event.type === "STEP_CHANGED" && step === lastLoggedStep) {
    return { step: lastLoggedStep, entry: null };
  }

  return { step, entry: toolEvent(event, id, sessionId) };
}
