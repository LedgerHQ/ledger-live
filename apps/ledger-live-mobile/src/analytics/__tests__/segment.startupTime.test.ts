import { NativeModules } from "react-native";
import { track } from "@shared/analytics";
import { waitFor } from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import reducers from "~/reducers";
import type { AppStore } from "~/reducers";
import { setAnalytics, setAnalyticsConsentInfo } from "~/actions/settings";
import { startupFirstImportTime } from "LLM/utils/logStartupTime";
import { clearStartupOriginCache } from "LLM/utils/resolveStartupEvents";
import * as segment from "../segment";

jest.unmock("../segment");
jest.unmock("@shared/analytics");

const { _trackMock: mockTrack } = require("@segment/analytics-react-native") as {
  _trackMock: jest.Mock;
};

const analyticsConsentInfo = {
  consentDate: "2026-04-29T00:00:00.000Z",
  privacyPolicyVersion: 1,
};

const makeStore = (): AppStore =>
  configureStore({
    reducer: reducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  }) as AppStore;

describe("segment startup time traits", () => {
  const originalDev = __DEV__;
  let getProcessStartTime: jest.SpyInstance;
  let store: AppStore;

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    Object.defineProperty(global, "__DEV__", { value: false, configurable: true });
    clearStartupOriginCache();
    getProcessStartTime = jest.spyOn(NativeModules.AppStartupModule, "getProcessStartTime");
    store = makeStore();
    store.dispatch(setAnalyticsConsentInfo(analyticsConsentInfo));
    store.dispatch(setAnalytics(true));
  });

  afterEach(() => {
    Object.defineProperty(global, "__DEV__", { value: originalDev, configurable: true });
    getProcessStartTime.mockRestore();
    jest.useFakeTimers();
  });

  it("sends the app process start as the startup time base when the native time is available", async () => {
    getProcessStartTime.mockReturnValue(startupFirstImportTime - 800);
    await segment.start(store);
    mockTrack.mockClear();

    track("TestEvent", {});

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({ appTimeToInteractiveBase: "process" }),
      ),
    );
  });

  it("sends the JS start as the startup time base when the native time is not available", async () => {
    getProcessStartTime.mockReturnValue(null);
    await segment.start(store);
    mockTrack.mockClear();

    track("TestEvent", {});

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith(
        "TestEvent",
        expect.objectContaining({ appTimeToInteractiveBase: "js" }),
      ),
    );
  });
});
