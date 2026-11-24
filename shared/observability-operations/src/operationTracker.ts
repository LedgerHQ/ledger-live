import type {
  OperationAttributes,
  OperationFailureReason,
  OperationId,
  OperationSink,
  OperationTracker,
  OperationTrackerOptions,
  SentOperationAttributes,
} from "./types";

const VALID_OPERATION_NAME = /^[\w.@$-]+$/;

const MAX_MONITORING_SESSION_MS = 4 * 60 * 60 * 1000;

type ActiveOperation = {
  id: OperationId;
  sink: OperationSink;
  startAttributes: SentOperationAttributes;
  startedAt: number;
};

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

const callSinkIgnoringErrors = (call: () => void): void => {
  try {
    call();
  } catch {}
};

const isRecording = (sink: OperationSink | null): sink is OperationSink => {
  try {
    return sink?.isRecording() === true;
  } catch {
    return false;
  }
};

export function createOperationTracker({
  now = Date.now,
}: OperationTrackerOptions = {}): OperationTracker {
  let sink: OperationSink | null = null;
  let lastId = 0;
  const activeByName = new Map<string, Map<KeySlot, ActiveOperation>>();

  const remove = (name: string, operationKey: string | undefined): void => {
    const byKey = activeByName.get(name);
    byKey?.delete(toSlot(operationKey));
    if (byKey?.size === 0) activeByName.delete(name);
  };

  const outlivedItsSession = (operation: ActiveOperation): boolean =>
    now() - operation.startedAt >= MAX_MONITORING_SESSION_MS;

  const dropStaleOperations = (): void => {
    for (const [name, byKey] of activeByName) {
      for (const [slot, operation] of byKey) {
        if (outlivedItsSession(operation)) byKey.delete(slot);
      }
      if (byKey.size === 0) activeByName.delete(name);
    }
  };

  const getActive = (
    name: string,
    operationKey: string | undefined,
  ): ActiveOperation | undefined => {
    const operation = activeByName.get(name)?.get(toSlot(operationKey));
    if (operation && outlivedItsSession(operation)) {
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
    if (!VALID_OPERATION_NAME.test(name)) return null;
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
      if (!VALID_OPERATION_NAME.test(name)) return null;
      dropStaleOperations();
      if (getActive(name, operationKey) || !isRecording(sink)) return null;

      const recordingSink = sink;
      const sent = compact(attributes);
      const id = ++lastId;
      const byKey = activeByName.get(name) ?? new Map<KeySlot, ActiveOperation>();
      byKey.set(toSlot(operationKey), {
        id,
        sink: recordingSink,
        startAttributes: sent,
        startedAt: now(),
      });
      activeByName.set(name, byKey);
      callSinkIgnoringErrors(() => recordingSink.start(name, operationKey, sent));
      return id;
    },

    succeed(name, { operationKey, attributes, expectedId } = {}) {
      const operation = take(name, operationKey, expectedId);
      if (!operation) return false;
      const sent = { ...operation.startAttributes, ...compact(attributes) };
      callSinkIgnoringErrors(() => operation.sink.succeed(name, operationKey, sent));
      return true;
    },

    fail(name, reason: OperationFailureReason, { operationKey, attributes, expectedId } = {}) {
      const operation = take(name, operationKey, expectedId);
      if (!operation) return false;
      const sent = { ...operation.startAttributes, ...compact(attributes) };
      callSinkIgnoringErrors(() => operation.sink.fail(name, operationKey, reason, sent));
      return true;
    },

    isActive(name, { operationKey, expectedId } = {}) {
      if (!VALID_OPERATION_NAME.test(name)) return false;
      const operation = getActive(name, operationKey);
      return !!operation && (expectedId === undefined || operation.id === expectedId);
    },

    getId(name, operationKey) {
      if (!VALID_OPERATION_NAME.test(name)) return null;
      return getActive(name, operationKey)?.id ?? null;
    },
  };
}

const tracker = createOperationTracker();

export const setOperationSink: OperationTracker["setSink"] = sink => tracker.setSink(sink);

export const startOperation: OperationTracker["start"] = (name, options) =>
  tracker.start(name, options);

export const succeedOperation: OperationTracker["succeed"] = (name, options) =>
  tracker.succeed(name, options);

export const failOperation: OperationTracker["fail"] = (name, reason, options) =>
  tracker.fail(name, reason, options);

export const isOperationActive: OperationTracker["isActive"] = (name, options) =>
  tracker.isActive(name, options);

export const getOperationId: OperationTracker["getId"] = (name, operationKey) =>
  tracker.getId(name, operationKey);
