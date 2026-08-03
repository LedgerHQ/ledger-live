import * as datadog from "~/datadog/renderer";

/**
 * Minimal in-house logger, replacing winston — whose file/http/stream transports dragged in
 * `fs`, `os`, `path`, `zlib`, `http`, `https` and `string_decoder`.
 *
 * The emitted shape matches winston's `combine(timestamp(), json())`. `timestamp` must stay
 * an ISO 8601 string: main types renderer logs as `Array<{ timestamp: string }>` and
 * interleaves them with its own by that field (src/main/mergeAllLogs.ts).
 */
export type LogEntry = {
  level: string;
  message?: string;
  timestamp?: string;
  type?: string;
  [key: string]: unknown;
};

export interface LogTransport {
  log(entry: LogEntry, callback: () => void): void;
}

// Kept in memory for later use on Ctrl+E.
class MemoryTransport implements LogTransport {
  _logs: LogEntry[] = [];
  capacity = 3000;
  getMemoryLogs() {
    return this._logs.slice(0).reverse();
  }

  log(info: LogEntry, callback: () => void) {
    this._logs.push(info);
    const l = this._logs.length;
    if (l > this.capacity) this._logs.splice(0, l - this.capacity);
    callback();
  }
}

export const memoryLogger = new MemoryTransport();
const transports: LogTransport[] = [memoryLogger];

export const add = (transport: LogTransport) => {
  transports.push(transport);
};

const noop = () => {};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(entry: LogEntry) {
  const withTimestamp: LogEntry = { timestamp: new Date().toISOString(), ...entry };
  for (const transport of transports) {
    try {
      transport.log(withTimestamp, noop);
    } catch {
      // A failing transport must never break the caller.
    }
  }
}

const logger = {
  /** Accepts a ready-made entry, or winston's positional `log(level, message, meta?)`. */
  log(levelOrEntry: string | LogEntry, message?: unknown, ...meta: unknown[]) {
    if (typeof levelOrEntry !== "string") {
      emit(levelOrEntry);
      return;
    }

    // An object message *is* the entry, so its keys stay at the top level. Stringifying it
    // into `message` instead drops `type`, which both the VERBOSE console filter
    // (~/renderer/init) and the exported-log merge (src/main/mergeAllLogs.ts) read.
    if (meta.length === 0 && isPlainObject(message)) {
      const entry: Record<string, unknown> = { ...message, level: levelOrEntry };
      if (message instanceof Error) {
        // `message` and `stack` are non-enumerable, so the spread above copied neither.
        entry.message = message.message;
        entry.stack = message.stack;
      }
      emit(entry as LogEntry);
      return;
    }

    const [first, ...rest] = meta;
    const hasMeta = isPlainObject(first);
    emit({
      level: levelOrEntry,
      message: typeof message === "string" ? message : JSON.stringify(message),
      ...(hasMeta ? first : {}),
      ...(hasMeta ? (rest.length ? { extra: rest } : {}) : meta.length ? { extra: meta } : {}),
    });
  },
};

export function enableDebugLogger(filter?: (log: LogEntry) => boolean) {
  add({
    log(log: LogEntry, callback: () => void) {
      if (filter && !filter(log)) {
        callback();
        return;
      }
      /* eslint-disable no-console */
      switch (log.level) {
        case "error":
          console.error(JSON.stringify(log));
          break;
        case "warn":
          console.warn(JSON.stringify(log));
          break;
        default:
          console.log(JSON.stringify(log));
          break;
      }
      /* eslint-enable */
      callback();
    },
  });
}
const logDb = !process.env.NO_DEBUG_DB;
const logRedux = !process.env.NO_DEBUG_ACTION;
const logTabkey = !process.env.NO_DEBUG_TAB_KEY;
const logWS = !process.env.NO_DEBUG_WS;
const logNetwork = !process.env.NO_DEBUG_NETWORK;
const logAnalytics = !process.env.NO_DEBUG_ANALYTICS;
const logApdu = !process.env.NO_DEBUG_DEVICE;
const logCountervalues = !process.env.NO_DEBUG_COUNTERVALUES;
const ANALYTICS_TYPE = "analytics";

type RTKQueryMeta = {
  arg?: unknown;
  endpointName?: string;
  requestId?: string;
  requestStatus?: string;
};

function isRTKQueryMeta(meta: unknown): meta is RTKQueryMeta {
  return (
    typeof meta === "object" &&
    meta !== null &&
    ("arg" in meta || "endpointName" in meta || "requestId" in meta)
  );
}

export default {
  onDB: (way: "read" | "write" | "clear", name: string) => {
    const msg = `📁  ${way} ${name}`;
    if (logDb) {
      logger.log("debug", msg, {
        type: "db",
      });
    }
  },
  // tracks Redux actions (NB not all actions are serializable)

  onReduxAction: (action: { type: string; meta?: unknown; error?: unknown; payload?: unknown }) => {
    if (logRedux) {
      const logData: Record<string, unknown> = {
        type: "action",
      };

      // Extract RTK Query details for better logging
      if (action.type.includes("/executeQuery/") || action.type.includes("/executeMutation/")) {
        if (isRTKQueryMeta(action.meta)) {
          if (action.meta.arg) {
            logData.queryArg = action.meta.arg;
          }
          if (action.meta.endpointName) {
            logData.endpointName = action.meta.endpointName;
          }
          if (action.meta.requestId) {
            logData.requestId = action.meta.requestId;
          }
        }

        // For rejected actions, include error details
        if (action.type.includes("/rejected")) {
          if (action.error) {
            logData.error = action.error;
          }
          if (action.payload) {
            logData.payload = action.payload;
          }
        }
      }

      logger.log("debug", `⚛️  ${action.type}`, logData);
    }
  },
  // tracks keyboard events
  onTabKey: (activeElement?: HTMLElement | null) => {
    if (!activeElement) return;
    const { classList, tagName } = activeElement;
    const displayEl = `${tagName.toLowerCase()}${classList.length ? ` ${classList.item(0)}` : ""}`;
    const msg = `⇓ <TAB> - active element ${displayEl}`;
    if (logTabkey) {
      logger.log("debug", msg, {
        type: "keydown",
      });
    }
  },
  apdu: (log: string) => {
    if (logApdu) {
      logger.log("debug", log, {
        type: "apdu",
      });
    }
  },
  websocket: (type: string, obj?: object) => {
    if (logWS) {
      logger.log("debug", `~ ${type}`, {
        ...obj,
        type: "ws",
      });
    }
  },
  network: ({ method, url, data }: { method: string; url: string; data: unknown }) => {
    const log = `➡📡  ${method} ${url}`;
    if (logNetwork) {
      logger.log("info", log, {
        type: "network",
        data,
      });
    }
  },
  networkSucceed: ({
    method,
    url,
    status,
    responseTime,
  }: {
    method: string;
    url: string;
    status: number;
    responseTime: number;
  }) => {
    const log = `✔📡  HTTP ${status} ${method} ${url} – finished in ${responseTime.toFixed(0)}ms`;
    if (logNetwork) {
      logger.log("info", log, {
        type: "network-response",
      });
    }
  },
  networkError: ({
    method,
    url,
    status,
    error,
    responseTime,
    ...rest
  }: {
    method: string;
    url: string;
    status: number;
    error: string;
    responseTime: number;
  }) => {
    const log = `✖📡  HTTP ${status} ${method} ${url} – ${error} – failed after ${responseTime.toFixed(
      0,
    )}ms`;
    if (logNetwork) {
      logger.log("info", log, {
        type: "network-error",
        status,
        method,
        ...rest,
      });
    }
  },
  networkDown: ({
    method,
    url,
    responseTime,
  }: {
    method: string;
    url: string;
    responseTime: number;
  }) => {
    const log = `✖📡  NETWORK DOWN – ${method} ${url} – after ${responseTime.toFixed(0)}ms`;
    if (logNetwork) {
      logger.log("info", log, {
        type: "network-down",
      });
    }
  },
  analyticsStart: (id: string, props: object) => {
    if (logAnalytics) {
      logger.log("info", `△ start() with user id ${id}`, {
        type: ANALYTICS_TYPE,
        data: props,
      });
    }
  },
  analyticsStop: () => {
    if (logAnalytics) {
      logger.log("info", "△ stop()", {
        type: ANALYTICS_TYPE,
      });
    }
  },
  analyticsTrack: (event: string, properties?: object) => {
    if (logAnalytics) {
      logger.log("info", `△ track ${event}`, {
        type: ANALYTICS_TYPE,
        data: properties,
      });
    }
    datadog.addBreadcrumb({
      level: "info",
      category: "track",
      message: event,
      data: properties as Record<string, unknown>,
    });
  },
  analyticsPage: (category: string, name?: string | null, properties?: object | null) => {
    const message = name ? `${category} ${name}` : category;
    if (logAnalytics) {
      logger.log("info", `△ page ${message}`, {
        type: ANALYTICS_TYPE,
        data: properties,
      });
    }
    datadog.addBreadcrumb({
      level: "info",
      category: "page",
      message,
      data: (properties ?? undefined) as Record<string, unknown> | undefined,
    });
  },
  countervalues: (...args: unknown[]) => {
    if (logCountervalues) {
      logger.log("debug", "Countervalues:", ...args);
    }
  },
  // General functions in case the hooks don't apply

  debug: (...args: unknown[]) => {
    logger.log("debug", ...args);
  },
  info: (...args: unknown[]) => {
    logger.log("info", ...args);
  },
  log: (...args: unknown[]) => {
    logger.log("info", ...args);
  },
  warn: (...args: unknown[]) => {
    logger.log("warn", ...args);
  },
  error: (...args: unknown[]) => {
    logger.log("error", ...args);
  },
  critical: (error: unknown, context?: string) => {
    if (context) {
      datadog.addBreadcrumb({
        level: "error",
        category: "context",
        message: context,
      });
    }
    const err = error instanceof Error ? error : new Error(String(error));
    logger.log("error", err.message, {
      stack: err.stack,
      ...err,
    });
    // anything else has no type and no stack of its own: in Datadog it becomes an unsearchable
    // "null" / "[object Object]" issue merged with every other caller, so we keep it local
    if (error instanceof Error || typeof error === "string") {
      datadog.captureException(err);
    }
  },
  add,
  onLog: (log: LogEntry | string) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    logger.log(log as LogEntry);
  },
};
