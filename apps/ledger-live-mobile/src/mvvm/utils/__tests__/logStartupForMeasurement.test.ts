import { LaunchArguments } from "react-native-launch-arguments";
import { logStartupEvent, startupEvents, startupFirstImportTime } from "../logStartupTime";
import { resetStartupOriginForTests, STARTUP_EVENTS } from "../resolveStartupEvents";
import { logStartupForMeasurement, STARTUP_PERF_LOG_ARGUMENT } from "../logStartupForMeasurement";

jest.mock("@shared/native-performance", () => ({ getProcessStartTime: jest.fn(() => null) }));
jest.mock("react-native-launch-arguments", () => ({
  LaunchArguments: { value: jest.fn(() => ({})) },
}));

const nativeLoggingHook = jest.fn();
const launchedForMeasurement = () =>
  jest.mocked(LaunchArguments.value).mockReturnValue({ [STARTUP_PERF_LOG_ARGUMENT]: 1 });
const sinceFirstImport = (event: { time: number }) => event.time - startupFirstImportTime;

describe("logStartupForMeasurement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(LaunchArguments.value).mockReturnValue({});
    startupEvents.splice(0);
    resetStartupOriginForTests();
    Object.assign(globalThis, { nativeLoggingHook });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "nativeLoggingHook");
  });

  it("writes the startup time and events, at the error level, when launched for the measurement", () => {
    launchedForMeasurement();
    const appStarted = logStartupEvent(STARTUP_EVENTS.APP_STARTED);
    const navReady = logStartupEvent(STARTUP_EVENTS.NAV_READY);
    logStartupEvent(STARTUP_EVENTS.APP_STARTED);

    logStartupForMeasurement(STARTUP_EVENTS.NAV_READY);

    expect(nativeLoggingHook).toHaveBeenCalledTimes(1);
    const [message, level] = nativeLoggingHook.mock.calls[0];
    expect(level).toBe(3);
    expect(message).toMatch(/^startup-perf \{/);
    expect(JSON.parse(message.slice("startup-perf ".length))).toEqual({
      t: sinceFirstImport(navReady),
      e: [
        [STARTUP_EVENTS.APP_STARTED, sinceFirstImport(appStarted), 2],
        [STARTUP_EVENTS.NAV_READY, sinceFirstImport(navReady), 1],
      ],
    });
  });

  it("writes nothing on a launch without the argument", () => {
    logStartupEvent(STARTUP_EVENTS.APP_STARTED);

    logStartupForMeasurement(STARTUP_EVENTS.APP_STARTED);

    expect(nativeLoggingHook).not.toHaveBeenCalled();
  });

  it("does not throw when the runtime has no native logging hook", () => {
    launchedForMeasurement();
    Reflect.deleteProperty(globalThis, "nativeLoggingHook");

    expect(() => logStartupForMeasurement(STARTUP_EVENTS.APP_STARTED)).not.toThrow();
  });
});
