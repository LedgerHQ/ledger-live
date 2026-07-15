import { AppState, type AppStateStatus } from "react-native";
import { waitFor } from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import reducers from "~/reducers";
import type { AppStore } from "~/reducers";
import { setAnalytics, setAnalyticsConsentInfo } from "~/actions/settings";
import { getNotificationPermissionStatus } from "~/logic/getNotificationPermissionStatus";
import * as segment from "../segment";

jest.unmock("../segment");

jest.mock("~/logic/getNotificationPermissionStatus", () => ({
  getNotificationPermissionStatus: jest.fn(),
}));

const mockGetNotificationPermissionStatus = getNotificationPermissionStatus as jest.Mock;

const { _trackMock: mockTrack } = require("@segment/analytics-react-native") as {
  _trackMock: jest.Mock;
};

const analyticsConsentInfo = {
  consentDate: "2026-04-29T00:00:00.000Z",
  privacyPolicyVersion: 1,
};

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const makeStore = (): AppStore =>
  configureStore({
    reducer: reducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  }) as AppStore;

describe("segment hasEnabledOsNotifications", () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useFakeTimers();
  });

  let store: AppStore;
  let appStateHandler: ((status: AppStateStatus) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    appStateHandler = undefined;
    jest.spyOn(AppState, "addEventListener").mockImplementation((type, handler) => {
      if (type === "change") appStateHandler = handler as (status: AppStateStatus) => void;
      return { remove: jest.fn() };
    });

    store = makeStore();
    store.dispatch(setAnalyticsConsentInfo(analyticsConsentInfo));
    store.dispatch(setAnalytics(true));
  });

  it("track() sends hasEnabledOsNotifications as true when the OS permission is AUTHORIZED", async () => {
    mockGetNotificationPermissionStatus.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
    await segment.start(store);
    mockTrack.mockClear();

    segment.track("TestEvent", {});

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({ hasEnabledOsNotifications: true }),
      ),
    );
  });

  it("track() sends hasEnabledOsNotifications as false when the OS permission is DENIED", async () => {
    mockGetNotificationPermissionStatus.mockResolvedValue(AuthorizationStatus.DENIED);
    await segment.start(store);
    mockTrack.mockClear();

    segment.track("TestEvent", {});

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({ hasEnabledOsNotifications: false }),
      ),
    );
  });

  it("refreshes on AppState 'active' so a later track() flips from false to true", async () => {
    // App starts with notifications denied.
    mockGetNotificationPermissionStatus.mockResolvedValue(AuthorizationStatus.DENIED);
    await segment.start(store);
    mockTrack.mockClear();

    segment.track("BeforeEnabling", {});
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "BeforeEnabling",
        expect.objectContaining({ hasEnabledOsNotifications: false }),
      ),
    );

    // User enables notifications in the phone settings and returns to the app.
    mockGetNotificationPermissionStatus.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
    appStateHandler?.("active");
    mockTrack.mockClear();

    segment.track("AfterEnabling", {});
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "AfterEnabling",
        expect.objectContaining({ hasEnabledOsNotifications: true }),
      ),
    );
  });

  it("deduplicates overlapping refreshes: an in-flight refresh is reused, not restarted", async () => {
    mockGetNotificationPermissionStatus.mockResolvedValue(AuthorizationStatus.DENIED);
    await segment.start(store);
    // Ensure the start-time refresh has settled (and cleared the in-flight promise) before we
    // start the deferred ones below, otherwise the first trigger would reuse it.
    await flushPromises();

    // A foreground refresh is now in-flight (its native read is deferred).
    const refresh = deferred<number>();
    mockGetNotificationPermissionStatus.mockClear();
    mockGetNotificationPermissionStatus.mockReturnValueOnce(refresh.promise);

    appStateHandler?.("active"); // starts the refresh
    appStateHandler?.("active"); // in-flight -> reused, no new native read
    appStateHandler?.("active"); // in-flight -> reused, no new native read

    // Only a single native read happened despite three triggers: no overlap
    expect(mockGetNotificationPermissionStatus).toHaveBeenCalledTimes(1);

    refresh.resolve(AuthorizationStatus.AUTHORIZED);
    mockTrack.mockClear();
    segment.track("AfterOverlap", {});
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "AfterOverlap",
        expect.objectContaining({ hasEnabledOsNotifications: true }),
      ),
    );
  });

  it("keeps the last-known value when a refresh rejects", async () => {
    mockGetNotificationPermissionStatus.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
    await segment.start(store);

    // A refresh on foreground fails (e.g. native error): the cached value must be preserved.
    mockGetNotificationPermissionStatus.mockRejectedValue(new Error("native failure"));
    appStateHandler?.("active");
    mockTrack.mockClear();

    segment.track("TestEvent", {});
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({ hasEnabledOsNotifications: true }),
      ),
    );
  });
});
