import { getStateNodes, type SnapshotFrom } from "xstate";
import { deviceOnboardingMachine } from "./machine";
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
  context: DeviceOnboardingContext,
): WatchedOnboardingContext {
  const verdict = context.genuineVerdict;

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
    availableFirmwareVersion: context.availableFirmwareUpdate?.finalFirmware.version ?? null,
    firmwareChecked: context.firmwareChecked,
    onEarlyCheckScreen: context.onEarlyCheckScreen,
    secureConnectionRequested: context.secureConnectionRequested,
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

export type HostToolPayload =
  | string
  | number
  | boolean
  | null
  | readonly HostToolPayload[]
  | { readonly [key: string]: HostToolPayload };

export type HostToolEvent = {
  readonly id: string;
  readonly type: OnboardingEvent["type"];
  readonly at: number;
  readonly detail?: HostToolEventDetail;
  readonly payload?: HostToolPayload;
};

export function toolEvent(event: OnboardingEvent, id: string, sessionId: string): HostToolEvent {
  let detail: HostToolEventDetail | undefined;

  if (event.type === "STEP_CHANGED") {
    detail = { kind: "step", step: event.state.currentOnboardingStep };
  } else if (event.type === "FIRMWARE_UPDATE_AVAILABLE") {
    detail = { kind: "firmware", version: event.output.update.finalFirmware.version };
  } else if (
    event.type === "SESSION_READY" ||
    event.type === "SESSION_CHANGED" ||
    event.type === "TRANSPORT_LOST"
  ) {
    detail = { kind: "session", sessionId };
  }

  return { id, type: event.type, at: Date.now(), detail, payload: eventPayload(event) };
}

const maxCopiedNodes = 500;
const truncated = "…";

function eventPayload(event: OnboardingEvent): HostToolPayload | undefined {
  const payload: Record<string, HostToolPayload> = {};
  const budget = { left: maxCopiedNodes };
  const seen = new WeakSet<object>();

  for (const [key, child] of Object.entries(event)) {
    if (key === "type") continue;
    const copied = plainPayload(child, seen, budget);
    if (copied !== undefined) payload[key] = copied;
  }

  return Object.keys(payload).length === 0 ? undefined : payload;
}

function plainPayload(
  value: unknown,
  seen: WeakSet<object>,
  budget: { left: number },
): HostToolPayload | undefined {
  if (budget.left <= 0) return truncated;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    budget.left -= 1;
    return value;
  }
  if (value === null) {
    budget.left -= 1;
    return null;
  }
  if (typeof value !== "object") return undefined;
  // Only an ancestor makes a cycle. The same object can sit in two places and is copied twice.
  if (seen.has(value)) return truncated;
  seen.add(value);
  budget.left -= 1;
  const copied = Array.isArray(value)
    ? copyItems(value, seen, budget)
    : copyFields(value, seen, budget);
  seen.delete(value);

  return copied;
}

function copyItems(
  value: readonly unknown[],
  seen: WeakSet<object>,
  budget: { left: number },
): HostToolPayload[] {
  const items: HostToolPayload[] = [];
  for (const child of value) {
    if (budget.left <= 0) {
      items.push(truncated);
      break;
    }
    const copied = plainPayload(child, seen, budget);
    if (copied !== undefined) items.push(copied);
  }
  return items;
}

function copyFields(
  value: object,
  seen: WeakSet<object>,
  budget: { left: number },
): HostToolPayload | undefined {
  const nested: Record<string, HostToolPayload> = {};
  if (value instanceof Error) {
    nested.name = value.name;
    nested.message = value.message;
  }
  for (const [key, child] of Object.entries(value)) {
    if (budget.left <= 0) {
      nested[truncated] = truncated;
      break;
    }
    const copied = plainPayload(child, seen, budget);
    if (copied !== undefined) nested[key] = copied;
  }

  return Object.keys(nested).length === 0 ? undefined : nested;
}

type SessionEventType = "SESSION_READY" | "SESSION_CHANGED" | "FIRMWARE_UPDATE_FLOW_CLOSED";

/** What a host or the devtool sends: the host adds the session id, which only it knows. */
export type HostOnboardingEvent =
  | Exclude<OnboardingEvent, { type: SessionEventType }>
  | { type: SessionEventType; sessionId?: DeviceSessionId };

/** `sessionId` is read only for the session events, so the others can be sent with no session. */
export function stampSession(
  event: HostOnboardingEvent,
  sessionId: () => DeviceSessionId,
): OnboardingEvent {
  switch (event.type) {
    case "SESSION_READY":
      return { type: "SESSION_READY", sessionId: sessionId() };
    case "SESSION_CHANGED":
      return { type: "SESSION_CHANGED", sessionId: sessionId() };
    case "FIRMWARE_UPDATE_FLOW_CLOSED":
      return { type: "FIRMWARE_UPDATE_FLOW_CLOSED", sessionId: sessionId() };
    default:
      return event;
  }
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

/** One machine update. `event` is the event that led to `state`. */
export type HostLogRow = {
  readonly state: string;
  readonly event?: HostToolEvent;
};

/** A state this step can reach. `auto` means the machine may move there with no event. */
export type HostNextState = {
  readonly event: string;
  readonly state: string;
};

type MachineNode = typeof deviceOnboardingMachine.root;

const hiddenFromNextStates = new Set(["LOCKED", "TRANSPORT_LOST", "QUIT"]);

export function nextStatesFrom(
  snapshot: SnapshotFrom<typeof deviceOnboardingMachine> | null,
): HostNextState[] {
  if (snapshot?.status !== "active") return [];

  // The deepest active node is the current state. Its ancestors are walked below.
  const start = getStateNodes(deviceOnboardingMachine.root, snapshot.value).reduce(
    (deepest, node) => (node.path.length > deepest.path.length ? node : deepest),
  ) as MachineNode;

  const rows: HostNextState[] = [];
  const seen = new Set<string>();
  const add = (event: string, target: MachineNode | undefined) => {
    if (!target) return;
    const state = target.path.join(".");
    if (!state) return;
    const key = `${event}\0${state}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ event, state });
  };

  const handledHere = new Set<string>();
  let node: MachineNode | undefined = start;
  while (node) {
    for (const transition of node.always ?? []) {
      for (const target of transition.target ?? []) add("auto", target);
    }
    for (const [event, transitions] of node.transitions) {
      if (
        event.startsWith("xstate.") ||
        hiddenFromNextStates.has(event) ||
        handledHere.has(event)
      ) {
        continue;
      }
      if (transitions.some(transition => transition.guard === undefined)) {
        handledHere.add(event);
      }
      for (const transition of transitions) {
        for (const target of transition.target ?? []) add(event, target);
      }
    }
    if (node === deviceOnboardingMachine.root) break;
    node = node.parent;
  }

  return rows;
}
