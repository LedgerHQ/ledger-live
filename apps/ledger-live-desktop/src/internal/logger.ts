import { Log } from "@ledgerhq/logs";

export const LOG_TYPE_INTERNAL = "internal";

/**
 * Simple logger sending recorded logs directly to the main process
 *
 * Usage: records logs coming from `@ledgerhq/logs` in the internal thread
 *
 * If performance issues are seen because of this direct send to the main process, several ideas could be implemented:
 * - a filtering on the `type` (or/and a level if it is implemented in `@ledgerhq/logs`) set from an env variable
 * - a `bulkLog` that records logs until a given threshold, and send them to the main process when reached
 */
export class ForwardToMainLogger {
  private static instance: ForwardToMainLogger | undefined;

  // Simple singleton factory
  static getLogger() {
    if (!ForwardToMainLogger.instance) {
      ForwardToMainLogger.instance = new ForwardToMainLogger();
    }
    return ForwardToMainLogger.instance;
  }

  // We could have a "log:bulk-log"
  log(log: Log) {
    process?.send?.({
      type: "log:log",
      data: log,
      requestId: "log", // Not used
    });
  }
}
