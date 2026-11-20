import type {
  OperationAttributes,
  OperationFailureReason,
  OperationId,
  OperationSink,
  OperationTracker,
  OperationTrackerOptions,
  SentOperationAttributes,
} from "./types";

/** Operation names monitoring vendors accept: letters, digits, `_`, `.`, `@`, `$` and `-`. */
const OPERATION_NAME = /^[\w.@$-]+$/;

/**
 * Monitoring sessions last 4 hours at most (Datadog RUM), so no stop can match an older start.
 * Such an entry leaked (its stop never came): it is dropped without a stop, and a new start of the
 * same name and key replaces it.
 */
const STALE_OPERATION_MS = 4 * 60 * 60 * 1000;

type ActiveOperation = {
  id: OperationId;
  /** The sink that received the start, and receives the stop. */
  sink: OperationSink;
  /** The attributes the start sent, sent again with the stop. */
  attributes: SentOperationAttributes;
  startedAt: number;
};

/** The key slot of an operation started without a key, apart from the empty key `""`. */
const NO_KEY = Symbol("no operation key");
type KeySlot = string | typeof NO_KEY;

const toSlot = (operationKey: string | undefined): KeySlot => operationKey ?? NO_KEY;

const compact = (attributes?: OperationAttributes): SentOperationAttributes => {
  const sent: SentOperationAttributes = {};
  for (const [key, value] of Object.entries(attributes ?? {})) {
    if (value !== undefined) sent[key] = value;
  }
  return sent;
};

/** A throwing sink never reaches the flow it observes. */
const callSink = (call: () => void): void => {
  try {
    call();
  } catch {
    // Telemetry is best effort: drop the event.
  }
};

const isRecording = (sink: OperationSink | null): sink is OperationSink => {
  try {
    return sink?.isRecording() === true;
  } catch {
    return false;
  }
};

/**
 * Tracks named operations, from start to success or failure, and sends their events to a sink.
 * - A start is sent only when a sink is registered and recording. Starting an operation that is
 *   already active keeps the first start, unless that start is stale (see `STALE_OPERATION_MS`).
 * - A stop is sent only when its start was, to the sink that received the start, whether or not it
 *   records anymore. It carries the start attributes merged with its own.
 * - An invalid operation name makes every call a no-op.
 */
export function createOperationTracker({
  now = Date.now,
}: OperationTrackerOptions = {}): OperationTracker {
  let sink: OperationSink | null = null;
  let lastId = 0;
  /** Active operations by name, then by key slot. */
  const active = new Map<string, Map<KeySlot, ActiveOperation>>();

  const remove = (name: string, operationKey: string | undefined): void => {
    const byKey = active.get(name);
    byKey?.delete(toSlot(operationKey));
    if (byKey?.size === 0) active.delete(name);
  };

  /** The active operation of a name and key, after dropping it, without a stop, when it is stale. */
  const getActive = (
    name: string,
    operationKey: string | undefined,
  ): ActiveOperation | undefined => {
    const operation = active.get(name)?.get(toSlot(operationKey));
    if (operation && now() - operation.startedAt >= STALE_OPERATION_MS) {
      remove(name, operationKey);
      return undefined;
    }
    return operation;
  };

  const take = (
    name: string,
    operationKey: string | undefined,
    expectedId: OperationId | undefined,
  ): ActiveOperation | null => {
    if (!OPERATION_NAME.test(name)) return null;
    const operation = getActive(name, operationKey);
    if (!operation || (expectedId !== undefined && operation.id !== expectedId)) return null;
    remove(name, operationKey);
    return operation;
  };

  return {
    setSink(nextSink) {
      sink = nextSink;
    },

    start(name, { operationKey, attributes } = {}) {
      if (!OPERATION_NAME.test(name)) return null;
      if (getActive(name, operationKey) || !isRecording(sink)) return null;

      const recordingSink = sink;
      const sent = compact(attributes);
      const id = ++lastId;
      const byKey = active.get(name) ?? new Map<KeySlot, ActiveOperation>();
      byKey.set(toSlot(operationKey), {
        id,
        sink: recordingSink,
        attributes: sent,
        startedAt: now(),
      });
      active.set(name, byKey);
      callSink(() => recordingSink.start(name, operationKey, sent));
      return id;
    },

    succeed(name, { operationKey, attributes, expectedId } = {}) {
      const operation = take(name, operationKey, expectedId);
      if (!operation) return false;
      const sent = { ...operation.attributes, ...compact(attributes) };
      callSink(() => operation.sink.succeed(name, operationKey, sent));
      return true;
    },

    fail(name, reason: OperationFailureReason, { operationKey, attributes, expectedId } = {}) {
      const operation = take(name, operationKey, expectedId);
      if (!operation) return false;
      const sent = { ...operation.attributes, ...compact(attributes) };
      callSink(() => operation.sink.fail(name, operationKey, reason, sent));
      return true;
    },

    isActive(name, { operationKey, expectedId } = {}) {
      if (!OPERATION_NAME.test(name)) return false;
      const operation = getActive(name, operationKey);
      return !!operation && (expectedId === undefined || operation.id === expectedId);
    },

    getId(name, operationKey) {
      if (!OPERATION_NAME.test(name)) return null;
      return getActive(name, operationKey)?.id ?? null;
    },
  };
}

/** The app-wide tracker, behind the functions below. Tests build their own with `createOperationTracker`. */
const tracker = createOperationTracker();

/** Registers the app's sink (apps only), or removes it with `null`. */
export const setOperationSink: OperationTracker["setSink"] = sink => tracker.setSink(sink);

/** Starts an operation: see `createOperationTracker`. @returns its id, or `null` when not started. */
export const startOperation: OperationTracker["start"] = (name, options) =>
  tracker.start(name, options);

/** Ends an active operation as a success. @returns whether a success event was sent. */
export const succeedOperation: OperationTracker["succeed"] = (name, options) =>
  tracker.succeed(name, options);

/** Ends an active operation as a failure. @returns whether a failure event was sent. */
export const failOperation: OperationTracker["fail"] = (name, reason, options) =>
  tracker.fail(name, reason, options);

export const isOperationActive: OperationTracker["isActive"] = (name, options) =>
  tracker.isActive(name, options);

/** The id of the active operation of a name and key, or `null` when none is active. */
export const getOperationId: OperationTracker["getId"] = (name, operationKey) =>
  tracker.getId(name, operationKey);
