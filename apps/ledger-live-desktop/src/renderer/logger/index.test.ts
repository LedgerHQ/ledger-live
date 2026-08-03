import logger, { memoryLogger, add, enableDebugLogger, type LogEntry } from "./index";

jest.mock("~/datadog/renderer", () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));

const datadogRenderer = jest.requireMock("~/datadog/renderer");

describe("renderer logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("critical", () => {
    it("should call Datadog captureException when error is Error instance", () => {
      const err = new Error("Critical error");
      logger.critical(err);
      expect(datadogRenderer.captureException).toHaveBeenCalledWith(err);
    });

    it("should add context breadcrumbs when context is provided", () => {
      const err = new Error("Critical error");
      logger.critical(err, "upload failed");
      expect(datadogRenderer.addBreadcrumb).toHaveBeenCalledWith({
        level: "error",
        category: "context",
        message: "upload failed",
      });
    });

    it("should wrap string values in Error and still call captureException", () => {
      logger.critical("string error");
      expect(datadogRenderer.captureException).toHaveBeenCalledWith(new Error("string error"));
    });

    it.each([
      ["null", null],
      ["undefined", undefined],
      ["a plain object", { code: 42 }],
      ["a DMK tagged error", { _tag: "DeviceLockedError" }],
    ])("should keep %s local instead of reporting it to Datadog", (_label, value) => {
      logger.critical(value);
      expect(datadogRenderer.captureException).not.toHaveBeenCalled();
    });
  });

  describe("analyticsTrack", () => {
    it("should call datadog addBreadcrumb with track category", () => {
      logger.analyticsTrack("button_clicked", { button: "submit" });
      expect(datadogRenderer.addBreadcrumb).toHaveBeenCalledWith({
        level: "info",
        category: "track",
        message: "button_clicked",
        data: { button: "submit" },
      });
    });
  });

  describe("entry format", () => {
    const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    beforeEach(() => {
      memoryLogger._logs.length = 0;
    });

    it("should stamp every entry with an ISO timestamp", () => {
      // The main process types renderer logs as `Array<{ timestamp: string }>` and merges
      // them with its own by that field, so this format is a cross-process contract.
      logger.debug("hello");
      expect(memoryLogger.getMemoryLogs()[0].timestamp).toMatch(ISO_8601);
    });

    it("should merge meta into the entry for the positional (level, message, meta) form", () => {
      logger.onDB("read", "accounts");
      expect(memoryLogger.getMemoryLogs()[0]).toMatchObject({
        level: "debug",
        message: "📁  read accounts",
        type: "db",
      });
    });

    it("should keep an object message's own keys at the top level (winston's 2-arg form)", () => {
      // The `listenLogs` firehose in live-common-setup.ts logs this shape. init.tsx's VERBOSE
      // filter and src/main/mergeAllLogs.ts both read `type` off the top level, so collapsing
      // the object into `message` silently kills both.
      logger.debug({ type: "apdu", message: "=> e0d2000000", data: { apdu: "e0d2" } });
      expect(memoryLogger.getMemoryLogs()[0]).toMatchObject({
        level: "debug",
        type: "apdu",
        message: "=> e0d2000000",
        data: { apdu: "e0d2" },
      });
    });

    it("should let the level argument win over a level key on the object", () => {
      logger.debug({ level: "info", type: "apdu" });
      expect(memoryLogger.getMemoryLogs()[0].level).toBe("debug");
    });

    it("should extract message and stack from an Error", () => {
      // An Error's `message` and `stack` are non-enumerable, so both JSON.stringify and a
      // spread yield "{}" — the error's detail has to be pulled out explicitly.
      logger.error(new Error("boom"));
      const entry = memoryLogger.getMemoryLogs()[0];
      expect(entry).toMatchObject({ level: "error", message: "boom" });
      expect(entry.stack).toContain("Error: boom");
    });

    it("should return memory logs newest-first", () => {
      logger.debug("first");
      logger.debug("second");
      expect(memoryLogger.getMemoryLogs().map(l => l.message)).toEqual(["second", "first"]);
    });

    it("should drop the oldest entries beyond capacity", () => {
      for (let i = 0; i < memoryLogger.capacity + 10; i++) logger.debug(`entry-${i}`);
      expect(memoryLogger._logs).toHaveLength(memoryLogger.capacity);
      expect(memoryLogger._logs[0].message).toBe("entry-10");
    });

    it("should accept a ready-made entry via onLog", () => {
      logger.onLog({ level: "warn", message: "from device" } as LogEntry);
      expect(memoryLogger.getMemoryLogs()[0]).toMatchObject({
        level: "warn",
        message: "from device",
      });
    });

    it("should keep logging when a transport throws", () => {
      add({
        log: () => {
          throw new Error("transport is broken");
        },
      });
      expect(() => logger.debug("still fine")).not.toThrow();
      expect(memoryLogger.getMemoryLogs()[0].message).toBe("still fine");
    });

    it("should route error level to console.error once debug logging is enabled", () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      enableDebugLogger();
      logger.error("boom");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
