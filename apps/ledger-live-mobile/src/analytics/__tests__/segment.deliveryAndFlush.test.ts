import { AppState, type AppStateStatus, type NativeEventSubscription } from "react-native";
import { configureStore } from "@reduxjs/toolkit";
import { DdLogs } from "@datadog/mobile-react-native";
import type { Subscription } from "rxjs";
import reducers, { type AppStore } from "~/reducers";
import { setAnalytics } from "~/actions/settings";
import * as segment from "../segment";
import type { LoggableEvent } from "../segment";

jest.unmock("../segment");

jest.mock("@datadog/mobile-react-native", () => ({
  ...jest.requireActual("@datadog/mobile-react-native"),
  DdLogs: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const segmentSdk = require("@segment/analytics-react-native") as {
  createClient: jest.Mock;
  _identifyMock: jest.Mock;
  _trackMock: jest.Mock;
};
const mockIdentify = segmentSdk._identifyMock;
const mockTrack = segmentSdk._trackMock;
const mockDdWarn = jest.mocked(DdLogs.warn);

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

const makeStore = (): AppStore =>
  configureStore({
    reducer: reducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
  }) as AppStore;

type LoggedEvent = LoggableEvent & { sdkTrackCalls: number };

describe("segment analytics delivery", () => {
  let store: AppStore;
  let clientFlush: jest.Mock;
  let pendingEvents: jest.Mock;
  let appStateHandlers: ((status: AppStateStatus) => void)[];
  let appStateRemovals: jest.Mock[];
  let logged: LoggedEvent[];
  let subscription: Subscription;
  let addEventListenerSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  const emitAppState = (status: AppStateStatus) => appStateHandlers.at(-1)?.(status);

  const startWithTracking = async () => {
    store.dispatch(setAnalytics(true));
    await segment.start(store);
    jest.clearAllMocks();
    logged.length = 0;
  };

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();

    appStateHandlers = [];
    appStateRemovals = [];
    addEventListenerSpy = jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_type, handler) => {
        const remove = jest.fn();
        appStateHandlers.push(handler as (status: AppStateStatus) => void);
        appStateRemovals.push(remove);
        return { remove } as NativeEventSubscription;
      });
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    clientFlush = jest.fn().mockResolvedValue(undefined);
    pendingEvents = jest.fn().mockResolvedValue(3);
    Object.assign(segmentSdk.createClient(), { flush: clientFlush, pendingEvents });

    logged = [];
    subscription = segment.trackSubject.subscribe(event =>
      logged.push({ ...event, sdkTrackCalls: mockTrack.mock.calls.length }),
    );
    logged.length = 0; // trackSubject is a ReplaySubject: drop what it replays from earlier tests

    store = makeStore();
  });

  afterEach(() => {
    subscription.unsubscribe();
    addEventListenerSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    jest.useFakeTimers();
  });

  describe("background flush", () => {
    it("should flush pending events when the app goes to background", async () => {
      await startWithTracking();

      emitAppState("background");
      await flushPromises();

      expect(clientFlush).toHaveBeenCalledTimes(1);
    });

    it("should flush pending events when the app becomes inactive", async () => {
      await startWithTracking();

      emitAppState("inactive");
      await flushPromises();

      expect(clientFlush).toHaveBeenCalledTimes(1);
    });

    it("should not flush when the app becomes active", async () => {
      await startWithTracking();

      emitAppState("active");
      await flushPromises();

      expect(clientFlush).not.toHaveBeenCalled();
    });

    it("should swallow a rejected background flush", async () => {
      await startWithTracking();
      clientFlush.mockRejectedValue(new Error("network down"));

      emitAppState("background");
      await flushPromises();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to flush analytics in background:",
        expect.any(Error),
      );
    });

    it("should remove the previous AppState subscription when start is called again", async () => {
      await startWithTracking();

      await segment.start(store);

      expect(appStateRemovals[0]).toHaveBeenCalledTimes(1);
    });
  });

  describe("flush wrapper", () => {
    it("should flush without logging an overlay entry when the queue is empty", async () => {
      await startWithTracking();
      pendingEvents.mockResolvedValue(0);

      await segment.flush();

      expect(clientFlush).toHaveBeenCalledTimes(1);
      expect(logged).toEqual([]);
    });

    it("should log the pending count when the queue is not empty", async () => {
      await startWithTracking();
      pendingEvents.mockResolvedValue(7);

      await segment.flush();

      expect(logged).toEqual([
        expect.objectContaining({
          eventName: "[Flush]",
          eventProperties: { pendingEvents: 7 },
          deliveryStatus: "flushed",
        }),
      ]);
    });

    it("should still flush when pendingEvents rejects", async () => {
      await startWithTracking();
      pendingEvents.mockRejectedValue(new Error("store unavailable"));

      await segment.flush();

      expect(clientFlush).toHaveBeenCalledTimes(1);
      expect(logged).toEqual([]);
    });
  });

  describe("delivery status", () => {
    it("should log track as enqueued only after the Segment client received it", async () => {
      await startWithTracking();

      await segment.track("TestEvent", { foo: "bar" });

      expect(mockTrack).toHaveBeenCalledWith("TestEvent", expect.objectContaining({ foo: "bar" }));
      expect(logged).toEqual([
        expect.objectContaining({
          eventName: "TestEvent",
          deliveryStatus: "enqueued",
          sdkTrackCalls: 1,
        }),
      ]);
    });

    it("should log screen as enqueued only after the Segment client received it", async () => {
      await startWithTracking();

      await segment.screen("Portfolio", "Detail");

      expect(mockTrack).toHaveBeenCalledWith("Page Portfolio Detail", expect.any(Object));
      expect(logged).toEqual([
        expect.objectContaining({
          eventName: "Page Portfolio Detail",
          deliveryStatus: "enqueued",
          sdkTrackCalls: 1,
        }),
      ]);
    });

    it("should log nothing when tracking consent is off", async () => {
      await segment.start(store);
      jest.clearAllMocks();
      logged.length = 0;

      await segment.track("TestEvent", { foo: "bar" });
      await segment.screen("Portfolio");

      expect(mockTrack).not.toHaveBeenCalled();
      expect(logged).toEqual([]);
    });

    it("should still track a mandatory event when tracking consent is off", async () => {
      await segment.start(store);
      jest.clearAllMocks();
      logged.length = 0;

      await segment.track("MandatoryEvent", null, true);

      expect(logged).toEqual([
        expect.objectContaining({
          eventName: "MandatoryEvent",
          deliveryStatus: "enqueued",
          sdkTrackCalls: 1,
        }),
      ]);
    });

    it("should log track as failed and not throw when the Segment client rejects", async () => {
      await startWithTracking();
      mockTrack.mockRejectedValueOnce(new Error("sdk down"));

      await expect(segment.track("TestEvent")).resolves.toBeUndefined();

      expect(logged).toEqual([
        expect.objectContaining({
          eventName: "TestEvent",
          deliveryStatus: "failed",
        }),
      ]);
    });

    it("should log screen as failed and not throw when the Segment client rejects", async () => {
      await startWithTracking();
      mockTrack.mockRejectedValueOnce(new Error("sdk down"));

      await expect(segment.screen("Portfolio", "Detail")).resolves.toBeUndefined();

      expect(logged).toEqual([
        expect.objectContaining({
          eventName: "Page Portfolio Detail",
          deliveryStatus: "failed",
        }),
      ]);
    });
  });

  describe("identify overlay", () => {
    it("should log [Identify] next to Start when analytics starts with tracking on", async () => {
      store.dispatch(setAnalytics(true));
      logged.length = 0;

      await segment.start(store);

      expect(logged.map(event => event.eventName)).toEqual(["[Identify]", "Start"]);
      expect(logged[0]).toEqual(
        expect.objectContaining({
          eventName: "[Identify]",
          eventProperties: { userIdPresent: expect.any(Boolean) },
          deliveryStatus: "enqueued",
        }),
      );
      expect(logged[1]).toEqual(
        expect.objectContaining({
          eventName: "Start",
          deliveryStatus: "enqueued",
        }),
      );
    });

    it("should keep track, screen and flush overlay entries after identify", async () => {
      await startWithTracking();
      pendingEvents.mockResolvedValue(2);

      await segment.updateIdentify();
      await segment.track("TestEvent", { foo: "bar" });
      await segment.screen("Portfolio", "Detail");
      await segment.flush();

      expect(logged.map(event => event.eventName)).toEqual([
        "[Identify]",
        "TestEvent",
        "Page Portfolio Detail",
        "[Flush]",
      ]);
    });

    it("should log [Identify] as enqueued after a successful identify", async () => {
      await startWithTracking();
      mockIdentify.mockClear();

      await segment.updateIdentify();

      expect(mockIdentify).toHaveBeenCalledTimes(1);
      expect(logged).toEqual([
        expect.objectContaining({
          eventName: "[Identify]",
          eventProperties: { userIdPresent: expect.any(Boolean) },
          deliveryStatus: "enqueued",
        }),
      ]);
    });

    it("should log [Identify] as failed and not throw when the Segment client rejects", async () => {
      await startWithTracking();
      mockIdentify.mockRejectedValueOnce(new Error("sdk down"));

      await expect(segment.updateIdentify()).resolves.toBeUndefined();

      expect(logged).toEqual([
        expect.objectContaining({
          eventName: "[Identify]",
          eventProperties: { userIdPresent: expect.any(Boolean) },
          deliveryStatus: "failed",
        }),
      ]);
    });

    it("should not log [Identify] when tracking consent is off", async () => {
      await segment.start(store);
      jest.clearAllMocks();
      logged.length = 0;

      await segment.updateIdentify();

      expect(mockIdentify).not.toHaveBeenCalled();
      expect(logged).toEqual([]);
    });
  });

  describe("missing Segment client", () => {
    it("should warn Datadog once, without user properties, however many events are skipped", async () => {
      store.dispatch(setAnalytics(true));
      segmentSdk.createClient.mockReturnValueOnce(undefined);
      await expect(segment.start(store)).rejects.toThrow(TypeError);
      logged.length = 0;

      await segment.track("FirstSkipped");
      await segment.track("SecondSkipped");
      await segment.screen("ThirdSkipped");

      expect(logged.map(event => event.deliveryStatus)).toEqual([
        "skipped_no_client",
        "skipped_no_client",
        "skipped_no_client",
      ]);
      expect(mockDdWarn.mock.calls).toEqual([
        ["analytics_event_skipped_no_client", { kind: "track", eventName: "FirstSkipped" }],
      ]);
    });
  });
});
