import type { DeviceSessionId } from "@ledgerhq/device-management-kit";
import { getStateNodes, type SnapshotFrom } from "xstate";
import { deviceOnboardingMachine } from "./machine";
import { firmwareSettled } from "./rules";
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

/**
 * @deprecated Read `toolContext` (the whole context as plain data) instead. Kept while app code
 * still reads these flat names.
 */
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
  firmwareUpToDate: boolean | null;
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

/**
 * @deprecated Read `toolContext` (the whole context as plain data) instead. Kept while app code
 * still reads these flat names.
 */
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
    firmwareChecked: firmwareSettled(firmware),
    firmwareUpToDate: firmwareSettled(firmware) ? firmware.kind === "upToDate" : null,
    onEarlyCheckScreen: context.onEarlyCheckScreen,
    secureConnectionRequested: snapshot.matches({ checks: { genuineCheck: "awaitingApproval" } }),
    isGenuine: verdict?.isGenuine ?? null,
    verdictMatchesSession: verdict === null ? null : verdict.sessionId === context.sessionId,
    genuineFailureKind: context.lastGenuineFailure?.kind ?? null,
    checksPaused: context.checksPaused,
  };
}

/**
 * The context as plain data for a devtool, without the `hiddenKeys`. `verdictMatchesSession` is the
 * row to watch: the machine drops the genuine verdict when the session moved under it.
 */
export function toolContext(context: DeviceOnboardingContext): HostToolPayload {
  const verdict = context.genuineVerdict;

  return (
    plainCopy({
      ...context,
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
    detail = {
      kind: "firmware",
      version: event.output.firmwareUpdateContext.availableUpdate.finalFirmware.version,
    };
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

const truncated = "…";

/**
 * Never copied, at any depth. The panel runs while a recovery phrase is entered and its export goes
 * into bug reports. `deviceId` is a hardware id, the Bluetooth MAC address on Android.
 * `lastDeviceState` repeats the device state events. The catalog lists every app, not the device's.
 * The firmware file keys only serve the download: the firmware `id` finds the build.
 */
const hiddenKeys = new Set([
  "dmk",
  "deviceId",
  "seedWordIndex",
  "seedPhraseWordCount",
  "lastDeviceState",
  "catalog",
  "secureElementFlags",
  "perso",
  "firmwareKey",
  "hash",
  "nextFinalFirmware",
]);

type InstalledApp = { bytes?: number | null; isDevTools?: boolean; warning?: string | null };

/** Counts only: the app names tell which coins the user holds. */
function appsSummary(applications: InstalledApp[], updates: unknown): HostToolPayload {
  return {
    count: applications.length,
    updates: Array.isArray(updates) ? updates.length : 0,
    bytes: applications.reduce((total, app) => total + (app.bytes ?? 0), 0),
    devTools: applications.filter(app => app.isDevTools).length,
    withWarning: applications.filter(app => app.warning).length,
  };
}

function withoutKey(value: object, ...omitted: string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !omitted.includes(key)));
}

/**
 * A plain-data copy. A loop back to a parent stops at "…". It runs inside the machine's inspection,
 * so it never throws: a log must not break the run it records.
 */
function plainCopy(value: unknown): HostToolPayload | undefined {
  try {
    return copyValue(value, new WeakSet<object>());
  } catch {
    return truncated;
  }
}

/** Marks a field whose getter threw. Not a string, so no check on a field's value mistakes it. */
const unreadable = Symbol("unreadable");

/** A getter can throw. That one field then shows "…", and the rest still copies. */
function read(value: object, key: string): unknown {
  try {
    return (value as Record<string, unknown>)[key];
  } catch {
    return unreadable;
  }
}

function copyValue(value: unknown, parents: WeakSet<object>): HostToolPayload | undefined {
  if (value === null || typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean") return value;
  if (value === unreadable) return truncated;
  if (typeof value !== "object") return undefined;
  // Only an ancestor makes a cycle. The same object can sit in two places and is copied twice.
  if (parents.has(value)) return truncated;
  parents.add(value);
  const copied = Array.isArray(value)
    ? value.map(child => copyValue(child, parents) ?? null)
    : copyFields(value, parents);
  parents.delete(value);

  return copied;
}

function copyFields(value: object, parents: WeakSet<object>): HostToolPayload {
  const nested: Record<string, HostToolPayload> = {};
  if (value instanceof Error) {
    nested.name = copyValue(read(value, "name"), parents) ?? truncated;
    nested.message = copyValue(read(value, "message"), parents) ?? truncated;
  }
  const applications = read(value, "applications");
  if (Array.isArray(applications)) {
    nested.apps = appsSummary(applications, read(value, "applicationsUpdates"));
  }
  // Keys, not entries: entries would call every getter before any of them is guarded.
  for (const key of Object.keys(value)) {
    const copied = copyField(value, key, parents);
    if (copied !== undefined) nested[key] = copied;
  }

  return nested;
}

/** One field of `value`, by the rules above. `undefined` leaves it out. */
function copyField(
  value: object,
  key: string,
  parents: WeakSet<object>,
): HostToolPayload | undefined {
  // Hidden, or already counted in `apps`.
  if (hiddenKeys.has(key) || key === "applications" || key === "applicationsUpdates") {
    return undefined;
  }
  const child = read(value, key);
  // A firmware file path, not the `firmware` check the context holds.
  if (key === "firmware" && typeof child === "string") return undefined;
  if (key === "installedLanguages" && Array.isArray(child)) return child.length;
  // A fetch error carries the same object twice, as `error` and `originalError`.
  if (key === "originalError" && child === read(value, "error")) return undefined;
  return copyValue(child, parents);
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
