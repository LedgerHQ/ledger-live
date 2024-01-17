import { getEnv } from "@ledgerhq/live-env";
import { Log } from "@ledgerhq/logs";
export type { Log };

// Runtime type check (type predicate) on the logs
export function isALog(log: unknown): log is Log {
  return (
    (log as Log).id !== undefined &&
    (log as Log).type !== undefined &&
    (log as Log).date !== undefined
  );
}

/**
 * Simple logger recording logs in memory (in the main process)
 *
 * Used to record logs coming from the internal process.
 * The logs follow the structure of `Log` from `@ledgerhq/logs`
 *
 * Works as a singleton
 */
export class InMemoryLogger {
  private logRecord: Log[];
  private static instance: InMemoryLogger | undefined;

  private constructor() {
    this.logRecord = [];
  }

  // Simple singleton factory
  static getLogger() {
    if (!InMemoryLogger.instance) {
      InMemoryLogger.instance = new InMemoryLogger();
    }
    return InMemoryLogger.instance;
  }

  /**
   * Records a log in memory.
   * If more logs are recorded than `maxLogCount`, the oldest ones are removed.
   */
  log(log: Log) {
    // Those env variables can be updated at runtime
    const maxLogCount = getEnv("EXPORT_MAX_LOGS");
    const excludedLogTypes = getEnv("EXPORT_EXCLUDED_LOG_TYPES").split(",");

    if (!excludedLogTypes.includes(log.type)) {
      this.logRecord.unshift(log);

      while (this.logRecord.length > maxLogCount) {
        this.logRecord.pop();
      }
    }
  }

  /**
   * Returns the list of recorded logs, from the most recent to the oldest.
   */
  getLogs(): Log[] {
    return this.logRecord;
  }
}

/**
 * Simple logger displaying on the console/stdout logs from the main process
 *
 * The filtering is set from the `VERBOSE` env variable.
 *
 * Works as a singleton.
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

      // eslint-disable-next-line no-console
    } else {
      this.everyLogs = false;
      this.filters = [];
    }

    console.log(
      `Logs console display setup (main process): ${JSON.stringify({
        everyLogs: this.everyLogs,
        filters: this.filters,
      })}`,
    );
  }

  /**
   * Displays a log in the console, if not filtered out.
   */
  log({ type, message, context, ...rest }: Log) {
    if (!this.everyLogs && !this.filters.includes(type)) {
      return;
    }

    try {
      if (context) {
        // Displays the tracing context before the message for better readability in the console
        // eslint-disable-next-line no-console
        console.log(
          `------------------------------\n${type}: ${JSON.stringify(context, null, 2)}\n${
            message || ""
          }\n${JSON.stringify(rest, null, 2)}`,
        );
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `------------------------------\n${type}: ${message || ""}${JSON.stringify(
            rest,
            null,
            2,
          )}`,
        );
      }
    } catch (_e) {
      console.error("Badly formatted log");
    }
  }
}
