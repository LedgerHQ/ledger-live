import type { DeviceOnboardingContext, OnboardingEvent, OnboardingStep } from "../types";

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
