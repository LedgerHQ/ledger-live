// @flow
import winston from "winston";
import Transport from "winston-transport";
import pname from "./pname";
import { summarize } from "./summarize";

const { format } = winston;
const { combine, json, timestamp } = format;

const pinfo = format(info => {
  if (!info.pname) {
    info.pname = pname;
  }
  return info;
});

const transports = [];

const logger = winston.createLogger({
  level: "debug",
  format: combine(pinfo(), timestamp(), json()),
  transports,
});

export const add = (transport: *) => {
  logger.add(transport);
};

export function enableDebugLogger() {
  let consoleT;
  if (typeof window === "undefined") {
    // on Node we want a concise logger
    consoleT = new winston.transports.Console({
      format: format.simple(),
    });
  } else {
    // On Browser we want to preserve direct usage of console with the "expandable" objects
    const SPLAT = Symbol.for("splat");
    class CustomConsole extends Transport {
      log(info, callback) {
        setImmediate(() => {
          this.emit("logged", info);
        });
        const rest = info[SPLAT];
        /* eslint-disable no-console, no-lonely-if */
        if (info.level === "error") {
          if (rest) {
            console.error(info.message, ...rest);
          } else {
            console.error(info.message);
          }
        } else if (info.level === "warn") {
          if (rest) {
            console.warn(info.message, ...rest);
          } else {
            console.warn(info.message);
          }
        } else {
          if (rest) {
            console.log(info.message, ...rest);
          } else {
            console.log(info.message);
          }
        }
        /* eslint-enable */
        callback();
      }
    }
    consoleT = new CustomConsole();
  }
  add(consoleT);
}

const captureBreadcrumb = (breadcrumb: any) => {
  if (!process.env.STORYBOOK_ENV) {
    try {
      if (typeof window !== "undefined") {
        import("~/sentry/renderer").then(sentry => sentry.captureBreadcrumb(breadcrumb));
      } else if (process.title === "Ledger Live Internal") {
        require("~/sentry/internal").captureBreadcrumb(breadcrumb);
      } else {
        require("~/sentry/main").captureBreadcrumb(breadcrumb);
      }
    } catch (e) {
      logger.log("warn", "Can't captureBreadcrumb", e);
    }
  }
};

const captureException = (error: Error) => {
  try {
    if (typeof window !== "undefined") {
      import("~/sentry/renderer").then(sentry => sentry.captureException(error));
    } else if (process.title === "Ledger Live Internal") {
      require("~/sentry/internal").captureException(error);
    } else {
      require("~/sentry/main").captureException(error);
    }
  } catch (e) {
    logger.log("warn", "Can't send to sentry", error, e);
  }
};

const logCmds = !process.env.NO_DEBUG_COMMANDS;
const logDb = !process.env.NO_DEBUG_DB;
const logRedux = !process.env.NO_DEBUG_ACTION;
const logTabkey = !process.env.NO_DEBUG_TAB_KEY;
const logWS = !process.env.NO_DEBUG_WS;
const logNetwork = !process.env.NO_DEBUG_NETWORK;
const logAnalytics = !process.env.NO_DEBUG_ANALYTICS;
const logApdu = !process.env.NO_DEBUG_DEVICE;
const logCountervalues = !process.env.NO_DEBUG_COUNTERVALUES;

const ANALYTICS_TYPE = "analytics";

export default {
  onCmd: (type: string, id: string, spentTime: number, data?: any) => {
    if (logCmds) {
      switch (type) {
        case "cmd.START":
          logger.log("info", `CMD ${id}.send()`, summarize({ type, data }));
          break;
        case "cmd.NEXT":
          logger.log("info", `● CMD ${id}`, summarize({ type, data }));
          break;
        case "cmd.COMPLETE":
          logger.log("info", `✔ CMD ${id} finished in ${spentTime.toFixed(0)}ms`, { type });
          captureBreadcrumb({
            level: "debug",
            category: "command",
            message: `✔ ${id}`,
          });
          break;
        case "cmd.ERROR":
          logger.log("warn", `✖ CMD ${id} error`, summarize({ type, data }));
          captureBreadcrumb({
            level: "error",
            category: "command",
            message: `✖ ${id}`,
          });
          break;
        default:
      }
    }
  },

  onDB: (way: "read" | "write" | "clear", name: string) => {
    const msg = `📁  ${way} ${name}`;
    if (logDb) {
      logger.log("debug", msg, { type: "db" });
    }
  },

  // tracks Redux actions (NB not all actions are serializable)

  onReduxAction: (action: Object) => {
    if (logRedux) {
      logger.log("debug", `⚛️  ${action.type}`, { type: "action" });
    }
  },

  // tracks keyboard events
  onTabKey: (activeElement: ?HTMLElement) => {
    if (!activeElement) return;
    const { classList, tagName } = activeElement;
    const displayEl = `${tagName.toLowerCase()}${classList.length ? ` ${classList.item(0)}` : ""}`;
    const msg = `⇓ <TAB> - active element ${displayEl}`;
    if (logTabkey) {
      logger.log("debug", msg, { type: "keydown" });
    }
  },

  apdu: (log: string) => {
    if (logApdu) {
      logger.log("debug", log, { type: "apdu" });
    }
  },

  websocket: (type: string, obj?: Object) => {
    if (logWS) {
      logger.log("debug", `~ ${type}`, { ...obj, type: "ws" });
    }
  },

  network: ({ method, url, data }: { method: string, url: string, data: * }) => {
    const log = `➡📡  ${method} ${url}`;
    if (logNetwork) {
      logger.log("info", log, { type: "network", data });
    }
  },

  networkSucceed: ({
    method,
    url,
    status,
    responseTime,
  }: {
    method: string,
    url: string,
    status: number,
    responseTime: number,
  }) => {
    const log = `✔📡  HTTP ${status} ${method} ${url} – finished in ${responseTime.toFixed(0)}ms`;
    if (logNetwork) {
      logger.log("info", log, { type: "network-response" });
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
    method: string,
    url: string,
    status: number,
    error: string,
    responseTime: number,
  }) => {
    const log = `✖📡  HTTP ${status} ${method} ${url} – ${error} – failed after ${responseTime.toFixed(
      0,
    )}ms`;
    if (logNetwork) {
      // $FlowFixMe
      logger.log("info", log, { type: "network-error", status, method, ...rest });
    }
  },

  networkDown: ({
    method,
    url,
    responseTime,
  }: {
    method: string,
    url: string,
    responseTime: number,
  }) => {
    const log = `✖📡  NETWORK DOWN – ${method} ${url} – after ${responseTime.toFixed(0)}ms`;
    if (logNetwork) {
      logger.log("info", log, { type: "network-down" });
    }
  },

  analyticsStart: (id: string, props: Object) => {
    if (logAnalytics) {
      logger.log("info", `△ start() with user id ${id}`, {
        type: ANALYTICS_TYPE,
        data: props,
      });
    }
  },

  analyticsStop: () => {
    if (logAnalytics) {
      logger.log("info", "△ stop()", { type: ANALYTICS_TYPE });
    }
  },

  analyticsTrack: (event: string, properties: ?Object) => {
    if (logAnalytics) {
      logger.log("info", `△ track ${event}`, { type: ANALYTICS_TYPE, data: properties });
    }
    captureBreadcrumb({
      level: "info",
      category: "track",
      message: event,
      data: properties,
    });
  },

  analyticsPage: (category: string, name: ?string, properties: ?Object) => {
    const message = name ? `${category} ${name}` : category;
    if (logAnalytics) {
      logger.log("info", `△ page ${message}`, { type: ANALYTICS_TYPE, data: properties });
    }
    captureBreadcrumb({
      level: "info",
      category: "page",
      message,
      data: properties,
    });
  },

  countervalues: (...args: any) => {
    if (logCountervalues) {
      logger.log("debug", "Countervalues:", ...args);
    }
  },

  // General functions in case the hooks don't apply

  debug: (...args: any) => {
    logger.log("debug", ...args);
  },

  info: (...args: any) => {
    logger.log("info", ...args);
  },

  log: (...args: any) => {
    logger.log("info", ...args);
  },

  warn: (...args: any) => {
    logger.log("warn", ...args);
  },

  error: (...args: any) => {
    logger.log("error", ...args);
  },

  critical: (error: Error, context?: string) => {
    if (context) {
      captureBreadcrumb({
        level: "critical",
        category: "context",
        message: context,
      });
    }
    logger.log("error", error && error.message, {
      stack: error && error.stack,
      // $FlowFixMe
      ...error,
    });
    captureException(error);
  },

  add,

  onLog: (log: *) => {
    logger.log(log);
  },
};
