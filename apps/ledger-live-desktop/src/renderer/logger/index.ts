import winston, { LogEntry } from "winston";
import Transport from "winston-transport";
import * as datadog from "~/datadog/renderer";
const { format } = winston;
const { combine, json, timestamp } = format;

// A transport that keep logs in memory for later use on Ctrl+E
class MemoryTransport extends Transport {
  _logs: unknown[] = [];
  capacity = 3000;
  getMemoryLogs() {
    return this._logs.slice(0).reverse();
  }

  log(info: unknown, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });
    this._logs.push(info);
    const l = this._logs.length;
    if (l > this.capacity) this._logs.splice(0, l - this.capacity);
    callback();
  }
}
export const memoryLogger = new MemoryTransport();
const transports = [memoryLogger];
const logger = winston.createLogger({
  level: "debug",
  format: combine(timestamp(), json()),
  transports,
});
export const add = (transport: winston.transport) => {
  logger.add(transport);
};

/**
 * Prints logs to the console, for debugging purposes.
 *
 * @param filter Optional filtering function applied to decide if the log should be printed
 */
export function enableDebugLogger(filter?: (log: LogEntry) => boolean) {
  let consoleT;

  if (typeof window === "undefined") {
    // on Node we want a concise logger
    consoleT = new winston.transports.Console({
      format: format.simple(),
    });
  } else {
    class CustomConsole extends Transport {
      log(log: LogEntry, callback: () => void) {
        if (filter && !filter(log)) {
          callback();
          return;
        }
        setImmediate(() => {
          this.emit("logged", log);
        });
        /* eslint-disable no-console, no-lonely-if */
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
      }
    }
    consoleT = new CustomConsole();
  }
  add(consoleT);
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

/**
 * Keys whose values must never reach the exportable support log.
 *
 * `queryArg` is recorded verbatim below, and RTK Query keeps the *unstripped* args on the action
 * even when an endpoint leaves them out of its cache key. Swap `/quote` alone carries live-app
 * supplied headers plus the user's send/receive addresses.
 */
const REDACTED_QUERY_ARG_KEYS = new Set([
  "customHeaders",
  "headers",
  "authorization",
  "accessToken",
  "token",
  "sendAddress",
  "receiveAddress",
  "addressFrom",
  "addressTo",
  "address",
  "freshAddress",
  "xpub",
]);

function isPlainObject(value: object): boolean {
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Recursively replaces sensitive values, preserving the shape so the log stays useful.
 *
 * Past the depth limit the subtree is dropped rather than passed through: a value this function
 * has not inspected must not reach a user-exportable file just because it sits deep in the args.
 *
 * A non-plain object (a `Date`, a `BigNumber`) is handed back as it came in so the transport
 * serializes it normally instead of seeing the `{}` or the internals that rebuilding it produces.
 * That only applies once it is known to carry nothing redacted, so a secret cannot survive by
 * sitting on a class instance rather than on a plain object.
 */
function walk(value: unknown, depth: number): { value: unknown; redacted: boolean } {
  if (depth > 5) return { value: "[truncated]", redacted: true };

  if (Array.isArray(value)) {
    let redacted = false;
    const items = value.map(item => {
      const walked = walk(item, depth + 1);
      redacted ||= walked.redacted;
      return walked.value;
    });
    return { value: redacted ? items : value, redacted };
  }

  if (typeof value !== "object" || value === null) return { value, redacted: false };

  let redacted = false;
  const entries = Object.entries(value).map(([key, entry]) => {
    if (REDACTED_QUERY_ARG_KEYS.has(key)) {
      redacted = true;
      return [key, "[redacted]"];
    }
    const walked = walk(entry, depth + 1);
    redacted ||= walked.redacted;
    return [key, walked.value];
  });

  // Rebuilding a non-plain object loses it, so only do so once it is known to hold something that
  // must not be logged. Tracking that explicitly rather than comparing identity matters: an array
  // is always rebuilt, and a `BigNumber` holds one.
  if (!redacted && !isPlainObject(value)) return { value, redacted };
  return { value: Object.fromEntries(entries), redacted };
}

export function redactQueryArg(value: unknown, depth = 0): unknown {
  return walk(value, depth).value;
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
            logData.queryArg = redactQueryArg(action.meta.arg);
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
    // @ts-expect-error spreading unknowns is fine
    logger.log("debug", ...args);
  },
  info: (...args: unknown[]) => {
    // @ts-expect-error spreading unknowns is fine
    logger.log("info", ...args);
  },
  log: (...args: unknown[]) => {
    // @ts-expect-error spreading unknowns is fine
    logger.log("info", ...args);
  },
  warn: (...args: unknown[]) => {
    // @ts-expect-error spreading unknowns is fine
    logger.log("warn", ...args);
  },
  error: (...args: unknown[]) => {
    // @ts-expect-error spreading unknowns is fine
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
    datadog.captureException(err);
  },
  add,
  onLog: (log: LogEntry | string) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    logger.log(log as LogEntry);
  },
};
