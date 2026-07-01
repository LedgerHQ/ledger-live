import React from "react";
import { AppState, type AppStateStatus, type NativeEventSubscription } from "react-native";
import { createStore } from "redux";
import { AuthorizationStatus, getMessaging } from "@react-native-firebase/messaging";
import { render, waitFor } from "@tests/test-renderer";
import storage from "LLM/storage";
import { NotificationsPromptBootstrap } from "LLM/features/NotificationsPrompt/new/NotificationsPromptBootstrap";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt/new/NotificationsPromptProvider";
import reducers, { type AppStore } from "~/reducers";
import { setAnalytics, setAnalyticsConsentInfo } from "~/actions/settings";
import { setNotificationPermissionStatus } from "~/actions/notifications";
import * as segment from "../segment";

jest.unmock("../segment");

const mockMessaging = getMessaging();
const mockedGetMessaging = jest.mocked(getMessaging);
const mockHasPermission = jest.mocked(mockMessaging.hasPermission);
type AuthorizationStatusType = (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];

const { _trackMock: mockTrack } = require("@segment/analytics-react-native") as {
  _trackMock: jest.Mock;
};

const analyticsConsentInfo = {
  consentDate: "2026-04-29T00:00:00.000Z",
  privacyPolicyVersion: 1,
};

const createAnalyticsStore = (): AppStore => {
  const store = createStore(reducers) as AppStore;
  store.dispatch(setAnalyticsConsentInfo(analyticsConsentInfo));
  store.dispatch(setAnalytics(true));
  return store;
};

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
};

const expectTrackedPermission = async (event: string, hasEnabledOsNotifications: boolean) => {
  await waitFor(() =>
    expect(mockTrack).toHaveBeenCalledWith(
      event,
      expect.objectContaining({ hasEnabledOsNotifications }),
    ),
  );
};

const captureAppStateActive = () => {
  const handlers = new Set<(status: AppStateStatus) => void>();
  const spy = jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((type, handler): NativeEventSubscription => {
      if (type === "change") {
        handlers.add(handler as (status: AppStateStatus) => void);
      }

      return {
        remove: jest.fn(() => handlers.delete(handler as (status: AppStateStatus) => void)),
      };
    });

  return {
    emit: () => handlers.forEach(handler => handler("active")),
    restore: () => spy.mockRestore(),
  };
};

describe("segment hasEnabledOsNotifications", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockedGetMessaging.mockReturnValue(mockMessaging);
    mockHasPermission.mockResolvedValue(AuthorizationStatus.DENIED);
    await storage.deleteAll();
  });

  it("uses the latest permission from the store", async () => {
    const store = createAnalyticsStore();
    store.dispatch(setNotificationPermissionStatus(AuthorizationStatus.DENIED));

    await segment.start(store);
    mockTrack.mockClear();

    segment.track("BeforeEnabling", {});
    await expectTrackedPermission("BeforeEnabling", false);

    store.dispatch(setNotificationPermissionStatus(AuthorizationStatus.AUTHORIZED));
    mockTrack.mockClear();

    segment.track("AfterEnabling", {});
    await expectTrackedPermission("AfterEnabling", true);
    expect(mockHasPermission).not.toHaveBeenCalled();
  });

  it("falls back to the OS permission read when the store is undefined", async () => {
    const store = createAnalyticsStore();
    mockHasPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);

    await segment.start(store);
    expect(mockHasPermission).toHaveBeenCalledTimes(1);
    mockTrack.mockClear();

    segment.track("FallbackPermissionRead", {});
    await expectTrackedPermission("FallbackPermissionRead", true);
    expect(store.getState().notifications.permissionStatus).toBe(AuthorizationStatus.AUTHORIZED);
  });

  it("deduplicates concurrent fallback OS permission reads", async () => {
    const store = createAnalyticsStore();
    const permissionRead = createDeferred<AuthorizationStatusType>();
    mockHasPermission.mockReturnValue(permissionRead.promise);

    const startPromise = segment.start(store);
    await waitFor(() => expect(mockHasPermission).toHaveBeenCalledTimes(1));

    const trackPromise = segment.track("ConcurrentPermissionRead", {});
    await Promise.resolve();
    expect(mockHasPermission).toHaveBeenCalledTimes(1);

    permissionRead.resolve(AuthorizationStatus.AUTHORIZED);
    await Promise.all([startPromise, trackPromise]);

    await expectTrackedPermission("ConcurrentPermissionRead", true);
    expect(store.getState().notifications.permissionStatus).toBe(AuthorizationStatus.AUTHORIZED);
    expect(mockHasPermission).toHaveBeenCalledTimes(1);
  });

  it("tracks false when the fallback OS permission read fails", async () => {
    const store = createAnalyticsStore();
    mockHasPermission.mockRejectedValue(new Error("native failure"));

    await segment.start(store);
    mockTrack.mockClear();

    segment.track("FallbackPermissionReadFailure", {});
    await expectTrackedPermission("FallbackPermissionReadFailure", false);
  });

  it("tracks the refreshed OS permission after returning active", async () => {
    const appState = captureAppStateActive();
    const { store, unmount } = render(
      <NotificationsPromptProvider>
        <NotificationsPromptBootstrap />
      </NotificationsPromptProvider>,
    );

    store.dispatch(setAnalyticsConsentInfo(analyticsConsentInfo));
    store.dispatch(setAnalytics(true));

    await waitFor(() =>
      expect(store.getState().notifications.permissionStatus).toBe(AuthorizationStatus.DENIED),
    );

    await segment.start(store as AppStore);
    mockTrack.mockClear();

    segment.track("BeforeReturningActive", {});
    await expectTrackedPermission("BeforeReturningActive", false);

    mockHasPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
    appState.emit();

    await waitFor(() =>
      expect(store.getState().notifications.permissionStatus).toBe(AuthorizationStatus.AUTHORIZED),
    );

    mockTrack.mockClear();
    segment.track("AfterReturningActive", {});

    await expectTrackedPermission("AfterReturningActive", true);

    unmount();
    appState.restore();
  });
});
