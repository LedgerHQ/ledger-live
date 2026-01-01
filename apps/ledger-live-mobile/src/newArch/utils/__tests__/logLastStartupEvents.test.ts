import { DdRumReactNavigationTracking } from "@datadog/mobile-react-navigation";
import { track } from "~/analytics";
import { navigationRef } from "~/rootnavigation";
import { viewNamePredicate } from "~/datadog";
import { logStartupEvent, startupEvents, startupFirstImportTime } from "../logStartupTime";
import { logLastStartupEvents, LAST_STARTUP_EVENTS } from "../logLastStartupEvents";

jest.mock("@datadog/mobile-react-navigation", () => ({
  DdRumReactNavigationTracking: { startTrackingViews: jest.fn() },
}));
jest.mock("~/analytics", () => ({ track: jest.fn() }));
jest.mock("~/rootnavigation", () => ({ navigationRef: { current: {} } }));
jest.mock("~/datadog", () => ({ viewNamePredicate: jest.fn() }));

describe("logLastStartupEvents", () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    startupEvents.splice(0);
  });

  it("tracks all startup events once both APP_STARTED and NAV_READY are logged", async () => {
    logStartupEvent("Step 1");
    await logLastStartupEvents(LAST_STARTUP_EVENTS.NAV_READY);
    const appStartedEvent = await logLastStartupEvents(LAST_STARTUP_EVENTS.APP_STARTED);

    expect(DdRumReactNavigationTracking.startTrackingViews).toHaveBeenCalledTimes(1);
    expect(DdRumReactNavigationTracking.startTrackingViews).toHaveBeenCalledWith(
      navigationRef.current,
      viewNamePredicate,
    );

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("app_startup_events", {
      appStartupTime: appStartedEvent.time - startupFirstImportTime,
      events: expect.arrayContaining([
        expect.objectContaining({ event: "Step 1", count: 1 }),
        expect.objectContaining({ event: LAST_STARTUP_EVENTS.APP_STARTED, count: 1 }),
        expect.objectContaining({ event: LAST_STARTUP_EVENTS.NAV_READY, count: 1 }),
      ]),
    });
  });

  it("does not track startup events if APP_STARTED is not logged", async () => {
    await logLastStartupEvents(LAST_STARTUP_EVENTS.NAV_READY);

    expect(startupEvents).toEqual([
      expect.objectContaining({ event: LAST_STARTUP_EVENTS.NAV_READY }),
    ]);
    expect(DdRumReactNavigationTracking.startTrackingViews).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it("does not track startup events if NAV_READY is not logged", async () => {
    await logLastStartupEvents(LAST_STARTUP_EVENTS.APP_STARTED);

    expect(startupEvents).toEqual([
      expect.objectContaining({ event: LAST_STARTUP_EVENTS.APP_STARTED }),
    ]);
    expect(DdRumReactNavigationTracking.startTrackingViews).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it("triggers tracking only once", async () => {
    await logLastStartupEvents(LAST_STARTUP_EVENTS.APP_STARTED);
    await logLastStartupEvents(LAST_STARTUP_EVENTS.NAV_READY);
    expect(track).toHaveBeenCalledTimes(1);

    await logLastStartupEvents(LAST_STARTUP_EVENTS.APP_STARTED);
    expect(track).toHaveBeenCalledTimes(1);
  });

  it("correctly extracts the LAST_STARTUP_EVENTS time as appStartupTime", async () => {
    logStartupEvent("First");
    logStartupEvent("Second");
    await logLastStartupEvents(LAST_STARTUP_EVENTS.APP_STARTED);
    const trackingCallEvent = logLastStartupEvents(LAST_STARTUP_EVENTS.NAV_READY);
    const last = logStartupEvent("Last");
    expect(last).toEqual(expect.objectContaining({ event: "Last" }));
    last.time += 50; // Make sure the last event is a few ms after NAV_READY

    const navReadyEvent = await trackingCallEvent;
    const expectedStartupTime = navReadyEvent!.time - startupFirstImportTime;
    expect(track).toHaveBeenCalledWith("app_startup_events", {
      appStartupTime: expectedStartupTime,
      events: expect.arrayContaining([
        expect.objectContaining({ event: "First" }),
        expect.objectContaining({ event: "Second" }),
        expect.objectContaining({ event: LAST_STARTUP_EVENTS.APP_STARTED }),
        expect.objectContaining({ event: LAST_STARTUP_EVENTS.NAV_READY }),
        expect.objectContaining({ event: "Last", time: last!.time - startupFirstImportTime }),
      ]),
    });
  });
});
