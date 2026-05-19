import { DdRum } from "@datadog/mobile-react-native";
import { DdRumReactNavigationTracking } from "@datadog/mobile-react-navigation";
import mmkvStorageWrapper from "LLM/storage/mmkvStorageWrapper";
import { track } from "~/analytics";
import { navigationRef } from "~/rootnavigation";
import { viewNamePredicate } from "~/datadog";
import { ddAddViewLoadingTime } from "../ddAddViewLoadingTime";
import { logStartupEvent, startupEvents, startupFirstImportTime } from "../logStartupTime";
import {
  LAST_EVENTS_BUFFER,
  logLastStartupEvents,
  type StorageCurrencyData,
  type StoreStorageData,
} from "../logLastStartupEvents";
import { STARTUP_EVENTS } from "../resolveStartupEvents";

jest.mock("@datadog/mobile-react-navigation", () => ({
  DdRumReactNavigationTracking: { startTrackingViews: jest.fn() },
}));
jest.mock("@datadog/mobile-react-native", () => ({
  DdRum: { addViewLoadingTime: jest.fn() },
}));
jest.mock("~/analytics", () => ({ track: jest.fn() }));
jest.mock("~/rootnavigation", () => ({ navigationRef: { current: {} } }));
jest.mock("~/datadog", () => ({ viewNamePredicate: jest.fn() }));

describe("logLastStartupEvents", () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    startupEvents.splice(0);
    await mmkvStorageWrapper.deleteAll();
  });

  afterEach(async () => {
    await mmkvStorageWrapper.deleteAll();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("tracks startup events after the buffer once both APP_STARTED and NAV_READY are logged", async () => {
    logStartupEvent("Step 1");
    await logLastStartupEvents(STARTUP_EVENTS.NAV_READY);
    const appStartedEventPromise = logLastStartupEvents(STARTUP_EVENTS.APP_STARTED);

    expect(DdRumReactNavigationTracking.startTrackingViews).toHaveBeenCalledTimes(1);
    expect(DdRumReactNavigationTracking.startTrackingViews).toHaveBeenCalledWith(
      navigationRef.current,
      viewNamePredicate,
    );
    expect(track).not.toHaveBeenCalled();

    jest.advanceTimersByTime(LAST_EVENTS_BUFFER);
    const appStartedEvent = await appStartedEventPromise;

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("app_startup_events", {
      appStartupTime: appStartedEvent.time - startupFirstImportTime,
      events: expect.arrayContaining([
        expect.objectContaining({ event: "Step 1", count: 1 }),
        expect.objectContaining({ event: STARTUP_EVENTS.APP_STARTED, count: 1 }),
        expect.objectContaining({ event: STARTUP_EVENTS.NAV_READY, count: 1 }),
      ]),
    });
  });

  it("does not track startup events if APP_STARTED is not logged", async () => {
    await logLastStartupEvents(STARTUP_EVENTS.NAV_READY);

    expect(startupEvents).toEqual([expect.objectContaining({ event: STARTUP_EVENTS.NAV_READY })]);
    expect(DdRumReactNavigationTracking.startTrackingViews).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it("does not track startup events if NAV_READY is not logged", async () => {
    await logLastStartupEvents(STARTUP_EVENTS.APP_STARTED);

    expect(startupEvents).toEqual([expect.objectContaining({ event: STARTUP_EVENTS.APP_STARTED })]);
    expect(DdRumReactNavigationTracking.startTrackingViews).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it("triggers tracking only once", async () => {
    await logLastStartupEvents(STARTUP_EVENTS.APP_STARTED);
    const navReadyEventPromise = logLastStartupEvents(STARTUP_EVENTS.NAV_READY);

    jest.advanceTimersByTime(LAST_EVENTS_BUFFER);
    await navReadyEventPromise;
    expect(track).toHaveBeenCalledTimes(1);
    expect(DdRumReactNavigationTracking.startTrackingViews).toHaveBeenCalledTimes(1);

    await logLastStartupEvents(STARTUP_EVENTS.APP_STARTED);
    await logLastStartupEvents(STARTUP_EVENTS.NAV_READY);
    expect(track).toHaveBeenCalledTimes(1);
    expect(DdRumReactNavigationTracking.startTrackingViews).toHaveBeenCalledTimes(1);
  });

  it("captures startup events logged during the buffer while keeping appStartupTime based on the last startup event", async () => {
    logStartupEvent("First");
    logStartupEvent("Second");
    await logLastStartupEvents(STARTUP_EVENTS.APP_STARTED);
    const trackingCallEvent = logLastStartupEvents(STARTUP_EVENTS.NAV_READY);
    jest.advanceTimersByTime(50);
    const last = logStartupEvent("Last");

    jest.advanceTimersByTime(LAST_EVENTS_BUFFER - 50);
    const navReadyEvent = await trackingCallEvent;
    const expectedStartupTime = navReadyEvent.time - startupFirstImportTime;
    expect(track).toHaveBeenCalledWith("app_startup_events", {
      appStartupTime: expectedStartupTime,
      events: expect.arrayContaining([
        expect.objectContaining({ event: "First" }),
        expect.objectContaining({ event: "Second" }),
        expect.objectContaining({ event: STARTUP_EVENTS.APP_STARTED }),
        expect.objectContaining({ event: STARTUP_EVENTS.NAV_READY }),
        expect.objectContaining({ event: "Last", time: last.time - startupFirstImportTime }),
      ]),
    });
  });

  it("includes the Datadog view loading marker when the helper runs before startup finalization", async () => {
    await logLastStartupEvents(STARTUP_EVENTS.APP_STARTED);
    const navReadyEventPromise = logLastStartupEvents(STARTUP_EVENTS.NAV_READY);

    expect(DdRumReactNavigationTracking.startTrackingViews).toHaveBeenCalledTimes(1);
    ddAddViewLoadingTime();
    expect(DdRum.addViewLoadingTime).toHaveBeenCalledWith(true);

    jest.advanceTimersByTime(LAST_EVENTS_BUFFER);
    await navReadyEventPromise;

    expect(track).toHaveBeenCalledWith("app_startup_events", {
      appStartupTime: expect.any(Number),
      events: expect.arrayContaining([
        expect.objectContaining({ event: "DD view loaded", count: 1 }),
      ]),
    });
  });

  it("tracks the time it took to load the storage", async () => {
    mmkvStorageWrapper.save("ble", "qwerty");
    mmkvStorageWrapper.save("accounts.0", "lorem ipsum");
    mmkvStorageWrapper.save("accounts.1", "lorem ipsum");
    mmkvStorageWrapper.save("countervalues.eth", "42");
    mmkvStorageWrapper.save("foo", "bar");
    mmkvStorageWrapper.monitor(true);
    mmkvStorageWrapper.get("ble");
    mmkvStorageWrapper.get("accounts.0");
    mmkvStorageWrapper.get("accounts.1");
    mmkvStorageWrapper.get("countervalues.eth");
    mmkvStorageWrapper.get("nonexistent_key");
    mmkvStorageWrapper.get("foo");
    const storageData = {
      readTime: 150,
      mmkvRead: mmkvStorageWrapper.flushAccessedKeys(false),
    };

    logStartupEvent<StoreStorageData>(STARTUP_EVENTS.STORE_STORAGE_READ, storageData);
    await logLastStartupEvents(STARTUP_EVENTS.APP_STARTED);
    const navReadyEventPromise = logLastStartupEvents(STARTUP_EVENTS.NAV_READY);

    jest.advanceTimersByTime(LAST_EVENTS_BUFFER);
    await navReadyEventPromise;

    expect(track).toHaveBeenCalledWith("app_startup_events", {
      appStartupTime: expect.any(Number),
      events: expect.any(Array),
      reduxStore_readTime: 150,
      reduxStore_size: '"qwerty""lorem ipsum""lorem ipsum""42""bar"'.length,
      reduxStore_bleSize: '"qwerty"'.length,
      reduxStore_accountsCount: 2,
      reduxStore_accountsSize: '"lorem ipsum"'.length * 2,
      reduxStore_countervaluesCount: 1,
      reduxStore_countervaluesSize: '"42"'.length,
      reduxStore_unknownsCount: 2, // nonexistent_key and foo
      reduxStore_unknownsSize: '"bar"'.length,
      fullStorage_keyCount: 5,
      fullStorage_size: expect.any(Number), // MMKV size is not predictable in tests
    });
  });

  it("tracks the time taken by the bridges currency hydration", async () => {
    const storageData = {
      readTime: 200,
      mmkvRead: [{ key: "accounts.0", value: "foo" }],
    };

    const currencyData = {
      results: [
        { status: "rejected", id: "bitcoin", reason: "", duration: 15 } as const,
        { status: "fulfilled", id: "ethereum", duration: 10 } as const,
        { status: "rejected", id: "foo", reason: "unknown currency", duration: 20 } as const,
      ],
      totalDuration: 400,
      mmkvRead: [
        { key: "bridgeproxypreload_ethereum", value: "bar" },
        { key: "bridgeproxypreload_bar", value: "baz" },
      ],
    };

    logStartupEvent<StoreStorageData>(STARTUP_EVENTS.STORE_STORAGE_READ, storageData);
    logStartupEvent<StorageCurrencyData>(STARTUP_EVENTS.CURRENCY_HYDRATED, currencyData);

    await logLastStartupEvents(STARTUP_EVENTS.APP_STARTED);
    const navReadyEventPromise = logLastStartupEvents(STARTUP_EVENTS.NAV_READY);

    jest.advanceTimersByTime(LAST_EVENTS_BUFFER);
    await navReadyEventPromise;

    expect(track).toHaveBeenCalledWith("app_startup_events", {
      appStartupTime: expect.any(Number),
      events: expect.any(Array),
      reduxStore_readTime: 200,
      reduxStore_size: expect.any(Number),
      reduxStore_accountsSize: expect.any(Number),
      reduxStore_countervaluesSize: 0,
      reduxStore_unknownsSize: undefined,
      reduxStore_accountsCount: 1,
      reduxStore_countervaluesCount: 0,
      reduxStore_unknownsCount: undefined,
      currencyStorage_currencyCount: 3,
      currencyStorage_entries: {
        bitcoin: { duration: 15, size: undefined },
        ethereum: { duration: 10, size: 3 },
        foo: { duration: 20, size: undefined },
      },
      currencyStorage_hydrationDuration: 400,
      currencyStorage_rejectedCount: 2,
      currencyStorage_size: "bar".length,
      currencyStorage_unknownCurrencies: ["foo"],
      fullStorage_size: expect.any(Number),
      fullStorage_keyCount: expect.any(Number),
    });
  });
});
