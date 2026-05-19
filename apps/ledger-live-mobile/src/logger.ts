/* eslint-disable no-console */
import Config from "react-native-config"; // for now we have the bare minimum
import { Log } from "@ledgerhq/logs";
import { getEnv, setEnvUnsafe } from "@ledgerhq/live-env";

export default {
  critical: (e: Error) => {
    if (Config.DEBUG_ERROR) console.error(e);
    else console.log(e);
  },
};

/**
 * Simple logger displaying on the console/stdout logs
 *
 * The filtering is set from the `VERBOSE` env variable.
 *
 * Works as a singleton.
 *
 * Note: we should add a log level defined in our logger, different that `type`.
 */
export class ConsoleLogger {
  private static instance: ConsoleLogger | undefined;
  private everyLogs: boolean = false;
  private filters: Array<string> = [];

  /**
   * Sets up debug console printing of logs
   *
   * Usage: a filtering (only on console printing) on Ledger libs are possible:
   * - VERBOSE="apdu,hw,transport,hid-verbose" : filtering on a list of log `type` separated by a `,`
   * - VERBOSE=1 or VERBOSE=true : to print all logs
   */
  private constructor() {
    // Makes sure the `VERBOSE` env has been set before the logger is created
    setEnvUnsafe("VERBOSE", Config.VERBOSE);

    this.refreshSetup();
  }

  // Simple singleton factory
  static getLogger() {
    if (!ConsoleLogger.instance) {
      ConsoleLogger.instance = new ConsoleLogger();
    }
    return ConsoleLogger.instance;
  }

  /**
   * Refreshes the logger config from the `VERBOSE` env variable
   */
  refreshSetup() {
    const logVerbose = getEnv("VERBOSE");

    if (logVerbose) {
      this.everyLogs =
        logVerbose.length === 1 && (logVerbose[0] === "true" || logVerbose[0] === "1");
      this.filters = this.everyLogs ? [] : logVerbose;
    } else {
      this.everyLogs = false;
      this.filters = [];
    }

    console.log("Logs console display setup:", {
      everyLogs: this.everyLogs,
      filters: this.filters,
    });
  }

  /**
   * Displays a log in the console, if not filtered out.
   *
   * Objects (context, data, ...) are passed as-is to `console.log` so that
   * DevTools can render them as interactive, inspectable trees.
   */
  log({ type, message, context, data, ...rest }: Log) {
    if (!this.everyLogs && !this.filters.includes(type)) {
      return;
    }

    const label = `[${type}]${message ? ` ${message}` : ""}`;
    const hasContext = !!context && Object.keys(context).length > 0;
    const hasData = data !== undefined;
    const hasRest = Object.keys(rest).length > 0;

    if (!hasContext && !hasData && !hasRest) {
      console.log(label);
      return;
    }

    console.groupCollapsed(label);
    if (hasContext) console.log("context:", context);
    if (hasData) console.log("data:", data);
    if (hasRest) console.log("extra:", rest);
    console.groupEnd();
  }
}
