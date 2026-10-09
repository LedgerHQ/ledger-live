import { getStateNodes, type SnapshotFrom } from "xstate";
import { deviceOnboardingMachine } from "./machine";
import type { DeviceSessionId } from "@ledgerhq/device-management-kit";
import type { DeviceOnboardingContext, OnboardingEvent, OnboardingStep } from "./types";

export const userEvents = [
  { type: "CONTINUE" },
  { type: "RETRY" },
  { type: "SKIP" },
  { type: "CLOSE" },
  { type: "QUIT" },
  { type: "USER_ACCEPT" },
  { type: "USER_DECLINE" },
] as const satisfies readonly OnboardingEvent[];

function readSessionId(read: () => string | null | undefined): string | null {
  try {
    return read() || null;
  } catch {
    return null;
  }
}

/**
 * The whole context as plain data for a devtool, without the kit and without `deviceId`: a hardware
 * identifier, the Bluetooth MAC address on Android. `verdictMatchesSession` is the row to watch: the
 * machine drops the genuine verdict when the session moved under it.
 */
export function toolContext(context: DeviceOnboardingContext): HostToolPayload {
  const verdict = context.genuineVerdict;

  return (
    plainCopy({
      ...withoutKey(context, "dmk", "deviceId"),
      verdictMatchesSession: verdict === null ? null : verdict.sessionId === context.sessionId,
    }) ?? {}
  );
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

  return {
    id,
    type: event.type,
    at: Date.now(),
    detail,
    payload: plainCopy(withoutKey(event, "type")),
  };
}

const maxCopiedNodes = 500;
const truncated = "…";

function withoutKey(value: object, ...omitted: string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !omitted.includes(key)));
}

/** A plain-data copy that stops after `maxCopiedNodes` values and on a loop back to a parent. */
function plainCopy(value: unknown): HostToolPayload | undefined {
  return copyValue(value, new WeakSet<object>(), { left: maxCopiedNodes });
}

function copyValue(
  value: unknown,
  seen: WeakSet<object>,
  budget: { left: number },
): HostToolPayload | undefined {
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
  if (seen.has(value)) {
    budget.left -= 1;
    return truncated;
  }
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
    const copied = copyValue(child, seen, budget);
    if (copied !== undefined) items.push(copied);
  }
  return items;
}

function copyFields(
  value: object,
  seen: WeakSet<object>,
  budget: { left: number },
): HostToolPayload {
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
    const copied = copyValue(child, seen, budget);
    if (copied !== undefined) nested[key] = copied;
  }

  return nested;
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

// The host sends these from any state, so listing them on every step adds nothing.
const hiddenFromNextStates = new Set(["LOCKED", "TRANSPORT_LOST", "QUIT", "SESSION_CHANGED"]);

/** The deepest active node is the current state. */
function currentNode(snapshot: SnapshotFrom<typeof deviceOnboardingMachine>): MachineNode {
  return getStateNodes(deviceOnboardingMachine.root, snapshot.value).reduce((deepest, node) =>
    node.path.length > deepest.path.length ? node : deepest,
  ) as MachineNode;
}

/**
 * The events a node handles, with every target. An event with no target is still accepted: the
 * machine stays in `current`.
 */
function transitionsOf(node: MachineNode, current: MachineNode): [string, MachineNode][] {
  const always = (node.always ?? []).flatMap(transition =>
    (transition.target ?? []).map(target => ["auto", target] as [string, MachineNode]),
  );
  const onEvents = [...node.transitions]
    .filter(([event]) => !event.startsWith("xstate.") && !hiddenFromNextStates.has(event))
    .flatMap(([event, transitions]) =>
      transitions.flatMap(transition =>
        (transition.target ?? [current]).map(target => [event, target] as [string, MachineNode]),
      ),
    );
  return [...always, ...onEvents];
}

/** An event without a guard stops the walk: the parents never see it. */
function handlesAlways(node: MachineNode, event: string): boolean {
  return node.transitions.get(event)?.some(transition => transition.guard === undefined) ?? false;
}

export function nextStatesFrom(
  snapshot: SnapshotFrom<typeof deviceOnboardingMachine> | null,
): HostNextState[] {
  if (snapshot?.status !== "active") return [];

  const current = currentNode(snapshot);
  const rows = new Map<string, HostNextState>();
  const handled = new Set<string>();

  // Walk from the current state up to the root, like xstate picks a transition.
  for (let node: MachineNode | undefined = current; node; node = node.parent) {
    for (const [event, target] of transitionsOf(node, current)) {
      const state = target.path.join(".");
      if (handled.has(event) || !state) continue;
      rows.set(`${event}\0${state}`, { event, state });
    }
    for (const event of node.transitions.keys()) {
      if (handlesAlways(node, event)) handled.add(event);
    }
  }

  return [...rows.values()];
}
