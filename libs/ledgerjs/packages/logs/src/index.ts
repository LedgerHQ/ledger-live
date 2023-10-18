export type TraceContext = Record<string, unknown>;
export type LogData = any;
export type LogType = string;

/**
 * A Log object
 */
export interface Log {
  /**
   * A namespaced identifier of the log (not a level like "debug", "error" but more like "apdu", "hw", etc...)
   */
  type: LogType;
  message?: string;
  /**
   * Data associated to the log event
   */
  data?: LogData;
  /**
   * Context data, coming for example from the caller's parent, to enable a simple tracing system
   */
  context?: TraceContext;
  /**
   * Unique id among all logs
   */
  id: string;
  /*
   * Date when the log occurred
   */
  date: Date;
}

export type Unsubscribe = () => void;
export type Subscriber = (arg0: Log) => void;

let id = 0;
const subscribers: Subscriber[] = [];

/**
 * Logs something
 *
 * @param type a namespaced identifier of the log (it is not a level like "debug", "error" but more like "apdu-in", "apdu-out", etc...)
 * @param message a clear message of the log associated to the type
 */
export const log = (type: LogType, message?: string, data?: LogData) => {
  const obj: Log = {
    type,
    id: String(++id),
    date: new Date(),
  };
  if (message) obj.message = message;
  if (data) obj.data = data;
  dispatch(obj);
};

/**
 * A simple tracer function, only expanding the existing log function
 *
 * Its goal is to capture more context than a log function.
 * This is simple for now, but can be improved later.
 *
 * @param context Anything representing the context where the log occurred
 */
export const trace = ({
  type,
  message,
  data,
  context,
}: {
  type: LogType;
  message?: string;
  data?: LogData;
  context?: TraceContext;
}) => {
  const obj: Log = {
    type,
    id: String(++id),
    date: new Date(),
  };

  if (message) obj.message = message;
  if (data) obj.data = data;
  if (context) obj.context = context;

  dispatch(obj);
};

/**
 * A simple tracer class, that can be used to avoid repetition when using the `trace` function
 *
 * Its goal is to capture more context than a log function.
 * This is simple for now, but can be improved later.
 *
 * @param type A given type (not level) for the current local tracer ("hw", "withDevice", etc.)
 * @param context Anything representing the context where the log occurred
 */
export class LocalTracer {
  constructor(
    private type: LogType,
    private context?: TraceContext,
  ) {}

  trace(message: string, data?: TraceContext) {
    trace({
      type: this.type,
      message,
      data,
      context: this.context,
    });
  }

  getContext(): TraceContext | undefined {
    return this.context;
  }

  setContext(context?: TraceContext) {
    this.context = context;
  }

  updateContext(contextToAdd: TraceContext) {
    this.context = { ...this.context, ...contextToAdd };
  }

  getType(): LogType {
    return this.type;
  }

  setType(type: LogType) {
    this.type = type;
  }

  /**
   * Create a new instance of the LocalTracer with an updated `type`
   *
   * It does not mutate the calling instance, but returns a new LocalTracer,
   * following a simple builder pattern.
   */
  withType(type: LogType): LocalTracer {
    return new LocalTracer(type, this.context);
  }

  /**
   * Create a new instance of the LocalTracer with a new `context`
   *
   * It does not mutate the calling instance, but returns a new LocalTracer,
   * following a simple builder pattern.
   *
   * @param context A TraceContext, that can undefined to reset the context
   */
  withContext(context?: TraceContext): LocalTracer {
    return new LocalTracer(this.type, context);
  }

  /**
   * Create a new instance of the LocalTracer with an updated `context`,
   * on which an additional context is merged with the existing one.
   *
   * It does not mutate the calling instance, but returns a new LocalTracer,
   * following a simple builder pattern.
   */
  withUpdatedContext(contextToAdd: TraceContext): LocalTracer {
    return new LocalTracer(this.type, { ...this.context, ...contextToAdd });
  }
}

/**
 * Adds a subscribers to the emitted logs.
 *
 * @param cb that is called for each future log() with the Log object
 * @return a function that can be called to unsubscribe the listener
 */
export const listen = (cb: Subscriber): Unsubscribe => {
  subscribers.push(cb);
  return () => {
    const i = subscribers.indexOf(cb);

    if (i !== -1) {
      // equivalent of subscribers.splice(i, 1) // https://twitter.com/Rich_Harris/status/1125850391155965952
      subscribers[i] = subscribers[subscribers.length - 1];
      subscribers.pop();
    }
  };
};

function dispatch(log: Log) {
  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i](log);
    } catch (e) {
      console.error(e);
    }
  }
}

// for debug purpose

declare global {
  interface Window {
    __ledgerLogsListen: any;
  }
}

if (typeof window !== "undefined") {
  window.__ledgerLogsListen = listen;
}
