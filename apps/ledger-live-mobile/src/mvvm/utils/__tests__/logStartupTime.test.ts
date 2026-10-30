import "../logStartup/beforeJSImports";
import { NativeModules } from "react-native";
import { logStartupEvent, startupEvents, startupFirstImportTime } from "../logStartupTime";
import {
  clearStartupOriginCache,
  getStartupTimeBase,
  resolveStartupEvents,
} from "../resolveStartupEvents";

describe("logStartupTime", () => {
  it("should log events from the first import", () => {
    expect(startupEvents).toEqual([{ event: "Before js imports", time: expect.any(Number) }]);
  });

  it("should log startup events and resolve them correctly", async () => {
    startupEvents.splice(0);
    jest.useRealTimers();
    const step1 = logStartupEvent("Step 1");
    const p = new Promise(r => setTimeout(() => r(logStartupEvent("Step 3"))));
    const step2 = logStartupEvent("Step 2");
    expect(startupEvents).toEqual([step1, step2]);
    await p;
    expect(resolveStartupEvents()).toEqual([
      { event: "Step 1", time: expect.any(Number), count: 1 },
      { event: "Step 2", time: expect.any(Number), count: 1 },
      { event: "Step 3", time: expect.any(Number), count: 1 },
    ]);
  });

  it("should resolve times relative to the first JS import", () => {
    startupEvents.splice(0);
    startupEvents.push({ event: "Step 1", time: startupFirstImportTime + 42 });
    expect(resolveStartupEvents()).toEqual([{ event: "Step 1", time: 42, count: 1 }]);
  });

  it("should group identical events", () => {
    startupEvents.splice(0);
    logStartupEvent("Step 1");
    logStartupEvent("Step 2");
    logStartupEvent("Step 1");
    expect(resolveStartupEvents()).toEqual([
      { event: "Step 1", time: expect.any(Number), count: 2 },
      { event: "Step 2", time: expect.any(Number), count: 1 },
    ]);
  });

  it("should keep logging events regardless of resolve calls", () => {
    startupEvents.splice(0);
    logStartupEvent("Step 1");
    expect(resolveStartupEvents()).toEqual([
      { event: "Step 1", time: expect.any(Number), count: 1 },
    ]);
    logStartupEvent("Step 2");
    expect(resolveStartupEvents()).toEqual([
      { event: "Step 1", time: expect.any(Number), count: 1 },
      { event: "Step 2", time: expect.any(Number), count: 1 },
    ]);
  });
});

describe("startup time base", () => {
  const originalDev = __DEV__;
  let getProcessStartTime: jest.SpyInstance;

  beforeEach(() => {
    Object.defineProperty(global, "__DEV__", { value: false, configurable: true });
    startupEvents.splice(0);
    startupEvents.push({ event: "Step 1", time: startupFirstImportTime + 42 });
    clearStartupOriginCache();
    getProcessStartTime = jest.spyOn(NativeModules.AppStartupModule, "getProcessStartTime");
  });

  afterEach(() => {
    Object.defineProperty(global, "__DEV__", { value: originalDev, configurable: true });
    jest.restoreAllMocks();
  });

  it("counts from the app process start in release builds", () => {
    getProcessStartTime.mockReturnValue(startupFirstImportTime - 800);

    expect(getStartupTimeBase()).toBe("process");
    expect(resolveStartupEvents()).toEqual([{ event: "Step 1", time: 842, count: 1 }]);
  });

  it("counts from the first JS import when the native module returns undefined", () => {
    getProcessStartTime.mockReturnValue(undefined);

    expect(getStartupTimeBase()).toBe("js");
    expect(resolveStartupEvents()).toEqual([{ event: "Step 1", time: 42, count: 1 }]);
  });

  it("counts from the first JS import when the process start is not available", () => {
    getProcessStartTime.mockReturnValue(null);

    expect(getStartupTimeBase()).toBe("js");
    expect(resolveStartupEvents()).toEqual([{ event: "Step 1", time: 42, count: 1 }]);
  });

  it("counts from the first JS import when the process start is after it", () => {
    getProcessStartTime.mockReturnValue(startupFirstImportTime + 5);

    expect(getStartupTimeBase()).toBe("js");
    expect(resolveStartupEvents()).toEqual([{ event: "Step 1", time: 42, count: 1 }]);
  });

  it("counts from the first JS import when the process start is more than a minute before it", () => {
    getProcessStartTime.mockReturnValue(startupFirstImportTime - 60_001);

    expect(getStartupTimeBase()).toBe("js");
    expect(resolveStartupEvents()).toEqual([{ event: "Step 1", time: 42, count: 1 }]);
  });

  it("counts from the first JS import when the native module fails, and warns once", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    getProcessStartTime.mockImplementation(() => {
      throw new Error("native failure");
    });

    expect(getStartupTimeBase()).toBe("js");
    expect(resolveStartupEvents()).toEqual([{ event: "Step 1", time: 42, count: 1 }]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("counts from the first JS import, without warning, when the native module is missing", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const appStartupModule = NativeModules.AppStartupModule;
    delete NativeModules.AppStartupModule;
    try {
      jest.isolateModules(() => {
        const isolated = require("../resolveStartupEvents");

        expect(isolated.getStartupTimeBase()).toBe("js");
      });
    } finally {
      NativeModules.AppStartupModule = appStartupModule;
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it("counts from the app process start when it is exactly at the first JS import", () => {
    getProcessStartTime.mockReturnValue(startupFirstImportTime);

    expect(getStartupTimeBase()).toBe("process");
    expect(resolveStartupEvents()).toEqual([{ event: "Step 1", time: 42, count: 1 }]);
  });

  it("counts from the app process start when it is exactly one minute before the first JS import", () => {
    getProcessStartTime.mockReturnValue(startupFirstImportTime - 60_000);

    expect(getStartupTimeBase()).toBe("process");
    expect(resolveStartupEvents()).toEqual([{ event: "Step 1", time: 60_042, count: 1 }]);
  });

  it("claims the process start time as soon as the app bundle starts", () => {
    getProcessStartTime.mockReturnValue(startupFirstImportTime - 800);

    jest.isolateModules(() => {
      require("../logStartup/claimProcessStartTime");
    });

    expect(getProcessStartTime).toHaveBeenCalledTimes(1);
  });

  it("reads the process start time only once", () => {
    getProcessStartTime.mockReturnValue(startupFirstImportTime - 800);

    getStartupTimeBase();
    resolveStartupEvents();
    resolveStartupEvents();

    expect(getProcessStartTime).toHaveBeenCalledTimes(1);
  });

  it("counts from the first JS import in dev builds", () => {
    Object.defineProperty(global, "__DEV__", { value: true, configurable: true });
    getProcessStartTime.mockReturnValue(startupFirstImportTime - 800);

    expect(getStartupTimeBase()).toBe("js");
    expect(resolveStartupEvents()).toEqual([{ event: "Step 1", time: 42, count: 1 }]);
    expect(getProcessStartTime).not.toHaveBeenCalled();
  });
});
