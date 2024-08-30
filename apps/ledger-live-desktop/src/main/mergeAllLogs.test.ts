import { Log } from "./logger";
import { mergeAllLogs, mergeAllLogsJSON, MergeResult } from "./mergeAllLogs";

const internalLogsChronological: Array<Log> = [
  { date: new Date(1), message: "Internal log 1" } as Log,
  { date: new Date(2), message: "Internal log 2" } as Log,
  { date: new Date(2), message: "Internal log 3 (same date as internal 2)" } as Log,
  { date: new Date(4), message: "Internal log 4" } as Log,
  { date: new Date(4), message: "Internal log 5 (same date as internal 4)" } as Log,
];

const rendererLogsChronological: Array<{ timestamp: string; message: string }> = [
  { timestamp: new Date(1).toISOString(), message: "Renderer log 1 (same date as internal 1)" },
  { timestamp: new Date(3).toISOString(), message: "Renderer log 2" },
  { timestamp: new Date(3).toISOString(), message: "Renderer log 3" },
  { timestamp: new Date(4).toISOString(), message: "Renderer log 4 (same date as internal 4)" },
  { timestamp: new Date(5).toISOString(), message: "Renderer log 5" },
];

const expectedMergedLogs: MergeResult = [
  {
    message:
      "Exporting logs: Only the last 8 logs are saved. To change this limit, set the EXPORT_MAX_LOGS env variable.",
    logIndex: 0,
    pname: "electron-main",
    timestamp: "1970-01-01T00:00:00.000Z",
    type: "exportLogsMeta",
  },
  {
    timestamp: "1970-01-01T00:00:00.002Z",
    message: "Internal log 2",
    pname: "electron-internal",
    logIndex: 2,
  },
  {
    timestamp: "1970-01-01T00:00:00.002Z",
    message: "Internal log 3 (same date as internal 2)",
    pname: "electron-internal",
    logIndex: 3,
  },
  {
    message: "Renderer log 2",
    pname: "electron-renderer",
    timestamp: "1970-01-01T00:00:00.003Z",
    logIndex: 4,
  },
  {
    message: "Renderer log 3",
    pname: "electron-renderer",
    timestamp: "1970-01-01T00:00:00.003Z",
    logIndex: 5,
  },
  {
    message: "Renderer log 4 (same date as internal 4)",
    pname: "electron-renderer",
    timestamp: "1970-01-01T00:00:00.004Z",
    logIndex: 6,
  },
  {
    timestamp: "1970-01-01T00:00:00.004Z",
    message: "Internal log 4",
    pname: "electron-internal",
    logIndex: 7,
  },
  {
    timestamp: "1970-01-01T00:00:00.004Z",
    message: "Internal log 5 (same date as internal 4)",
    pname: "electron-internal",
    logIndex: 8,
  },
  {
    message: "Renderer log 5",
    pname: "electron-renderer",
    timestamp: "1970-01-01T00:00:00.005Z",
    logIndex: 9,
  },
];

const expectedMergedLogsJSON = `\
[
  {
    "logIndex": 0,
    "timestamp": "1970-01-01T00:00:00.000Z",
    "pname": "electron-main",
    "type": "exportLogsMeta",
    "message": "Exporting logs: Only the last 8 logs are saved. To change this limit, set the EXPORT_MAX_LOGS env variable."
  },
  {
    "logIndex": 2,
    "timestamp": "1970-01-01T00:00:00.002Z",
    "pname": "electron-internal",
    "message": "Internal log 2"
  },
  {
    "logIndex": 3,
    "timestamp": "1970-01-01T00:00:00.002Z",
    "pname": "electron-internal",
    "message": "Internal log 3 (same date as internal 2)"
  },
  {
    "logIndex": 4,
    "timestamp": "1970-01-01T00:00:00.003Z",
    "pname": "electron-renderer",
    "message": "Renderer log 2"
  },
  {
    "logIndex": 5,
    "timestamp": "1970-01-01T00:00:00.003Z",
    "pname": "electron-renderer",
    "message": "Renderer log 3"
  },
  {
    "logIndex": 6,
    "timestamp": "1970-01-01T00:00:00.004Z",
    "pname": "electron-renderer",
    "message": "Renderer log 4 (same date as internal 4)"
  },
  {
    "logIndex": 7,
    "timestamp": "1970-01-01T00:00:00.004Z",
    "pname": "electron-internal",
    "message": "Internal log 4"
  },
  {
    "logIndex": 8,
    "timestamp": "1970-01-01T00:00:00.004Z",
    "pname": "electron-internal",
    "message": "Internal log 5 (same date as internal 4)"
  },
  {
    "logIndex": 9,
    "timestamp": "1970-01-01T00:00:00.005Z",
    "pname": "electron-renderer",
    "message": "Renderer log 5"
  }
]`;

describe("mergeAllLogs", () => {
  it("should merge logs from the renderer process and logs recorded from the internal process", () => {
    const mergedLogs = mergeAllLogs(rendererLogsChronological, internalLogsChronological, 8);

    console.log("mergedLogs", mergedLogs);

    expect(mergedLogs).toEqual(expectedMergedLogs);
  });
});

describe("mergeAllLogsJSON", () => {
  it("return the merged logs with their keys properly ordered (logIndex, then date, then process, then message)", () => {
    const mergedLogsJSON = mergeAllLogsJSON(
      rendererLogsChronological,
      internalLogsChronological,
      8,
    );

    expect(mergedLogsJSON).toEqual(expectedMergedLogsJSON);
  });
});
