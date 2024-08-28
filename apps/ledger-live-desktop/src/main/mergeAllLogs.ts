import { Log } from "./logger";

/**
 * Custom JSON.stringify function that orders the keys in a specified order.
 */
export function customStringify(obj: unknown) {
  const orderedKeys = [
    "logIndex",
    "timestamp",
    "pname",
    "type",
    "level",
    "id",
    "message",
    "data",
    "context",
  ];

  return JSON.stringify(
    obj,
    (_, value) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const orderedObject: Record<string, unknown> = {};

        // Add the keys in the specified order
        for (const key of orderedKeys) {
          if (key in value) {
            orderedObject[key] = value[key];
          }
        }

        // Add the remaining keys
        for (const key in value) {
          if (!(key in orderedObject)) {
            orderedObject[key] = value[key];
          }
        }

        return orderedObject;
      }
      return value;
    },
    2,
  );
}

export type MergeResult = Array<
  | ({
      logIndex: number;
      /** Process name */
      pname: string;
      /** Date formatted in ISO string (this is badly named but we're keeping the legacy name for compatibility with the logs viewer) */
      timestamp: string;
    } & Record<string, unknown>)
  | string
>;

/**
 * Merges logs from the renderer process and logs recorded from the internal process.
 * The logs are ordered by date and the most recent logs are kept.
 *
 * @param rendererLogsChronological Logs from the renderer process, ordered by date.
 * @param internalLogsChronological Logs from the internal process, ordered by date.
 * @param maxLogCount The maximum number of logs to keep.
 * @returns The merged logs, ordered by date.
 */
export function mergeAllLogs(
  rendererLogsChronological: Array<{ timestamp: string }>,
  internalLogsChronological: Array<Log>,
  maxLogCount: number,
): MergeResult {
  console.log(
    `Saving ${rendererLogsChronological.length} logs from the renderer process and ${internalLogsChronological.length} logs from the internal process`,
  );

  function compareLogs(
    a: { timestamp: string; pname: string; originalIndex: number },
    b: { timestamp: string; pname: string; originalIndex: number },
  ) {
    const dateCompared = a.timestamp.localeCompare(b.timestamp);
    if (dateCompared !== 0 || a.pname !== b.pname) return dateCompared;
    return a.originalIndex - b.originalIndex;
  }

  const allLogs: MergeResult = [
    ...rendererLogsChronological.map((log, index) => ({
      ...log,
      pname: "electron-renderer",
      originalIndex: index, // This is used to keep the order of the logs in case some logs in that collection have the same date
    })),
    ...internalLogsChronological.map((log, index) => {
      const { date, ...rest } = log;
      return {
        ...rest,
        pname: "electron-internal",
        timestamp: typeof date === "string" ? date : date.toISOString(),
        originalIndex: index,
      };
    }),
  ]
    .sort(compareLogs)
    .map((log, index) => {
      const { originalIndex, ...rest } = log;
      return { ...rest, logIndex: index };
    })
    .slice(-maxLogCount);

  if (rendererLogsChronological.length + internalLogsChronological.length > maxLogCount) {
    allLogs.unshift({
      message: `Exporting logs: Only the last ${maxLogCount} logs are saved. To change this limit, set the EXPORT_MAX_LOGS env variable.`,
      logIndex: 0,
      type: "exportLogsMeta",
      pname: "electron-main",
      timestamp: new Date(0).toISOString(),
    });
  }

  return allLogs;
}

export function mergeAllLogsJSON(
  rendererLogsChronological: Array<{ timestamp: string }>,
  internalLogsChronological: Array<Log>,
  maxLogCount: number,
) {
  return customStringify(
    mergeAllLogs(rendererLogsChronological, internalLogsChronological, maxLogCount),
  );
}
