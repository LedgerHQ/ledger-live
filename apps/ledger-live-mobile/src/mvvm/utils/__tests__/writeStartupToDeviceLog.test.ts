import { logStartupEvent, startupEvents, startupFirstImportTime } from "../logStartupTime";
import { resetStartupOriginForTests, STARTUP_EVENTS } from "../resolveStartupEvents";
import { writeStartupToDeviceLog } from "../writeStartupToDeviceLog";

jest.mock("@shared/native-performance", () => ({ getProcessStartTime: jest.fn(() => null) }));

const nativeLoggingHook = jest.fn();
const sinceFirstImport = (event: { time: number }) => event.time - startupFirstImportTime;

describe("writeStartupToDeviceLog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    startupEvents.splice(0);
    resetStartupOriginForTests();
    Object.assign(globalThis, { nativeLoggingHook });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "nativeLoggingHook");
  });

  it("writes a line per startup event, then the App startup time, at the error level", () => {
    const appStarted = logStartupEvent(STARTUP_EVENTS.APP_STARTED);
    const navReady = logStartupEvent(STARTUP_EVENTS.NAV_READY);
    logStartupEvent(STARTUP_EVENTS.APP_STARTED);

    writeStartupToDeviceLog(STARTUP_EVENTS.NAV_READY);

    expect(nativeLoggingHook.mock.calls).toEqual([
      [`[startup] App started (x2): ${sinceFirstImport(appStarted)} ms`, 3],
      [`[startup] Splash screen faded (x1): ${sinceFirstImport(navReady)} ms`, 3],
      [`[startup] App startup time: ${sinceFirstImport(navReady)} ms, 2 events`, 3],
    ]);
  });

  it("does not throw when the runtime has no native logging hook", () => {
    Reflect.deleteProperty(globalThis, "nativeLoggingHook");

    expect(() => writeStartupToDeviceLog(STARTUP_EVENTS.APP_STARTED)).not.toThrow();
  });
});
